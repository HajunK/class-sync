"use client";

import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { createClass, joinClassByCode } from "@/lib/db";
import { validateSchedule } from "@/lib/schedule";
import type { ClassSchedule } from "@/lib/types";
import { ScheduleFields } from "./ScheduleFields";
import { Field, Modal, Spinner } from "./ui";
import { useWorkspace } from "./workspace";

/** Join a class with a code, or create a new class. Used in a modal and on the empty state. */
export function AddClassForm({ onDone }: { onDone?: () => void }) {
  const { actor, select } = useWorkspace();
  const { profile } = useAuth();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [code, setCode] = useState("");
  const [form, setForm] = useState({ school: profile?.school || "", course: "", section: "" });
  const [schedule, setSchedule] = useState<ClassSchedule>({ days: [], start: "", end: "" });
  const [triedSave, setTriedSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const scheduleErrors = validateSchedule(schedule);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create" && scheduleErrors) return setTriedSave(true);
    setBusy(true);
    try {
      const id = mode === "join" ? await joinClassByCode(actor, code) : await createClass(actor, { ...form, schedule });
      toast.success(mode === "join" ? "You joined the class." : "Class created. Share the class code with your classmates.");
      select(id);
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-paper p-1 text-sm font-semibold">
        {(["join", "create"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx("rounded-lg py-2 transition", mode === m ? "bg-white text-navy-900 shadow-sm" : "text-muted")}
          >
            {m === "join" ? "Join with code" : "Create a class"}
          </button>
        ))}
      </div>

      {mode === "join" ? (
        <Field label="Class code" hint="Ask a classmate for the 6-character code.">
          <input
            className="input text-center font-mono text-xl font-bold tracking-[0.4em] uppercase"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="ABC123"
          />
        </Field>
      ) : (
        <>
          <Field label="School">
            <input className="input" required value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="KIS Jeju" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course">
              <input className="input" required value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="AP Biology" />
            </Field>
            <Field label="Section">
              <input className="input" required value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="Section A" />
            </Field>
          </div>
          <ScheduleFields value={schedule} onChange={setSchedule} errors={triedSave ? scheduleErrors : null} />
        </>
      )}

      <button className="btn btn-primary w-full" disabled={busy || (mode === "join" && code.length < 6)}>
        {busy ? <Spinner className="h-4 w-4" /> : mode === "join" ? "Join class" : "Create class"}
      </button>
    </form>
  );
}

export function AddClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add a class">
      <AddClassForm onDone={onClose} />
    </Modal>
  );
}
