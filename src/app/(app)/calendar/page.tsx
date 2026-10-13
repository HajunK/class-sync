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
  const { actor, visible, classById, memberships, selectedId } = useWorkspace();
  const classIds = useMemo(() => visible.map((c) => c.id), [visible]);
  const events = useEvents(classIds);

  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; event?: ClassEvent | null; date?: string }>({ open: false });
  const opened = openId ? events.find((e) => e.id === openId) ?? null : null;

  // Missed-announcement catch-up: upcoming entries a classmate added or changed since my last visit.
  const today = todayKey();
  const newEvents = events.filter(
    (e) => e.date >= today && memberships[e.classId] && isNewForMe(e, actor.uid, tsToDate(memberships[e.classId].lastSeenAt)),
  );
  const newIds = new Set(newEvents.map((e) => e.id));

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
        classById={classById}
        newIds={newIds}
        onSelectEvent={(e) => setOpenId(e.id)}
        onAddOnDate={(date) => setForm({ open: true, date })}
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
        defaultClassId={selectedId ?? undefined}
        classes={visible}
        actor={actor}
        onClose={() => setForm({ open: false })}
      />
    </div>
  );
}
