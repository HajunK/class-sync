"use client";

import { format } from "date-fns";
import { FileText, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClassDot, EmptyState, Field, Modal, Spinner } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { createSession, useSessions } from "@/lib/db";
import { fromKey, todayKey } from "@/lib/dates";

export default function NotesPage() {
  const { actor, visible, classById, selectedId } = useWorkspace();
  const classIds = useMemo(() => visible.map((c) => c.id), [visible]);
  const sessions = useSessions(classIds);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy-900">Notes</h1>
          <p className="text-sm text-muted">
            {selectedId ? `${classById[selectedId].course} · ${classById[selectedId].section}` : "All your classes"} · one page per lesson
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New note
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No notes yet"
          body="Create a page for today's lesson. Classmates write their notes on the same page."
        />
      ) : (
        <div className="card divide-y divide-line">
          {sessions.map((s) => {
            const cls = classById[s.classId];
            const mine = s.contributors.includes(actor.uid);
            return (
              <Link
                key={s.id}
                href={`/notes/${s.classId}/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-paper"
              >
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[10px] font-semibold text-gold-600 uppercase">{format(fromKey(s.date), "MMM")}</p>
                  <p className="font-serif text-2xl leading-none font-bold text-navy-900">{format(fromKey(s.date), "d")}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy-900">{s.topic}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    {cls && <ClassDot color={cls.color} className="!h-2 !w-2" />}
                    {cls?.course} · {s.contributors.length} note{s.contributors.length === 1 ? "" : "s"}
                    {!mine && " · you haven't written yet"}
                  </p>
                </div>
                {s.merged && (
                  <span className="chip bg-navy-900 text-gold-500">
                    <Sparkles className="h-3 w-3" /> Class note
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <NewNoteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewNoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actor, visible, selectedId } = useWorkspace();
  const router = useRouter();
  const [form, setForm] = useState({ classId: "", date: todayKey(), topic: "" });
  const [busy, setBusy] = useState(false);
  const classId = form.classId || selectedId || visible[0]?.id || "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await createSession(actor, classId, form);
      router.push(`/notes/${classId}/${id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New lesson note">
      <form onSubmit={submit} className="space-y-4">
        {visible.length > 1 && (
          <Field label="Class">
            <select className="input" value={classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              {visible.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course} · {c.section}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Lesson date">
          <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Topic">
          <input
            className="input"
            required
            maxLength={120}
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Glycolysis"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary min-w-24" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
