"use client";

import { format } from "date-fns";
import { BellRing } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarView } from "@/components/CalendarView";
import { ClassFilterBar } from "@/components/ClassFilterBar";
import { EventDetailModal } from "@/components/EventDetailModal";
import { EventFormModal } from "@/components/EventFormModal";
import { UpcomingChecklist } from "@/components/UpcomingChecklist";
import { useData } from "@/components/data";
import { useWorkspace } from "@/components/workspace";
import { isNewForMe, markClassSeen, setEventDone } from "@/lib/db";
import { fromKey, todayKey, tsToDate } from "@/lib/dates";
import type { ClassEvent } from "@/lib/types";

export default function CalendarPage() {
  const { actor, classes, visible, classById, memberships, selectedId } = useWorkspace();
  // The timeline shows every class; the month view and the banner follow the sidebar's pick.
  const { events: allEvents } = useData();
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

  // The Upcoming checklist: every entry from today on, across all my classes, minus what I've checked off.
  const upcoming = allEvents.filter((e) => e.date >= today);
  const doneIds = new Set(Object.values(memberships).flatMap((m) => m.doneEventIds ?? []));

  return (
    <>
      {/* Sidebar left, calendar filling the rest. The calendar comes first on small screens. */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="order-2 border-t border-line bg-navy-100/60 lg:order-1 lg:w-[29%] lg:max-w-[440px] lg:min-w-[320px] lg:border-t-0 lg:border-r">
          <UpcomingChecklist
            events={upcoming}
            classById={classById}
            doneIds={doneIds}
            onToggle={(e, done) => setEventDone(actor.uid, e.classId, e.id, done).catch((err) => toast.error((err as Error).message))}
            onOpen={(e) => setOpenId(e.id)}
            onAdd={(anchor) => setForm({ open: true, anchor })}
          />
        </aside>

        <section className="order-1 flex min-w-0 flex-1 flex-col bg-white lg:order-2">
          <ClassFilterBar variant="pane" />
          {newEvents.length > 0 && (
            <div className="mx-6 mt-5 mb-5 rounded-xl border border-navy-600/40 bg-gold-50 px-4 py-3">
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
                    className="rounded-lg bg-white px-2.5 py-1 text-xs text-navy-900 ring-1 ring-navy-600/40 hover:ring-navy-600"
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
        </section>
      </div>

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
    </>
  );
}
