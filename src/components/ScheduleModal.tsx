"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setClassSchedule } from "@/lib/db";
import { validateSchedule } from "@/lib/schedule";
import type { ClassRoom, ClassSchedule } from "@/lib/types";
import { ScheduleFields } from "./ScheduleFields";
import { Modal, Spinner } from "./ui";

/** Set or change when an existing class meets. */
export function ScheduleModal({ cls, onClose }: { cls: ClassRoom | null; onClose: () => void }) {
  return (
    <Modal open={!!cls} onClose={onClose} title="Class schedule" subtitle={cls ? `${cls.course} · ${cls.section}` : undefined}>
      {cls && <ScheduleForm key={cls.id} cls={cls} onClose={onClose} />}
    </Modal>
  );
}

function ScheduleForm({ cls, onClose }: { cls: ClassRoom; onClose: () => void }) {
  const [schedule, setSchedule] = useState<ClassSchedule>(cls.schedule ?? { days: [], start: "", end: "" });
  const [triedSave, setTriedSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const errors = validateSchedule(schedule);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (errors) return setTriedSave(true);
    setBusy(true);
    try {
      await setClassSchedule(cls.id, schedule);
      toast.success("Schedule saved.");
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ScheduleFields value={schedule} onChange={setSchedule} errors={triedSave ? errors : null} />
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
