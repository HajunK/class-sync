"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addEvent, editEvent, type Actor, type EventInput } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { EVENT_TYPES, type ClassEvent, type ClassRoom } from "@/lib/types";
import { Field, Modal, Popover, Spinner } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  actor: Actor;
  classes: ClassRoom[];
  /** When set, the form corrects this entry. */
  event?: ClassEvent | null;
  defaultDate?: string;
  defaultClassId?: string;
  /** Open as a popover at this screen point (e.g. a clicked calendar day) instead of a centered modal. */
  anchor?: { x: number; y: number } | null;
}

export function EventFormModal(props: Props) {
  const title = props.event ? "Correct entry" : "Add to class calendar";
  if (props.anchor) {
    return (
      <Popover anchor={props.open ? props.anchor : null} onClose={props.onClose} title={title}>
        {/* Stays rendered while closing so the form shrinks away with the popover. */}
        <EventForm key={`${props.defaultDate}-${props.anchor.x}-${props.anchor.y}`} {...props} />
      </Popover>
    );
  }
  return (
    <Modal open={props.open} onClose={props.onClose} title={title}>
      {props.open && <EventForm key={props.event?.id ?? "new"} {...props} />}
    </Modal>
  );
}

function EventForm({ onClose, actor, classes, event, defaultDate, defaultClassId }: Props) {
  const [form, setForm] = useState<EventInput>(() =>
    event
      ? { type: event.type, title: event.title, date: event.date, time: event.time || "", details: event.details || "" }
      : { type: "quiz", title: "", date: defaultDate || todayKey(), time: "", details: "" },
  );
  const [classId, setClassId] = useState(event?.classId || defaultClassId || classes[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (event) {
        const reset = await editEvent(actor, event, form);
        toast.success(reset ? "Saved. Classmates will need to confirm it again." : "Saved.");
      } else {
        await addEvent(actor, classId, form);
        toast.success("Added. Everyone in the class can see it now.");
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!event && classes.length > 1 && (
        <Field label="Class">
          <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course} · {c.section}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value as EventInput["type"])}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input className="input" type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
      </div>
      <Field label="Title">
        <input className="input" required maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Unit 3 quiz" />
      </Field>
      <Field label="Time (optional)">
        <input className="input" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
      </Field>
      <Field label="Details (optional)">
        <textarea
          className="input min-h-[80px]"
          maxLength={1000}
          value={form.details}
          onChange={(e) => set("details", e.target.value)}
          placeholder="Chapters covered, format, what to bring…"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary min-w-24" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Save"}
        </button>
      </div>
    </form>
  );
}
