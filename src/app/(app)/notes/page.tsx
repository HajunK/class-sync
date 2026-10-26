"use client";

import { format } from "date-fns";
import { FileText, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useData } from "@/components/data";
import { NoteThumbnail } from "@/components/notes/NoteThumbnail";
import { EmptyState, Field, Modal, Spinner } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { createSession } from "@/lib/db";
import { fromKey, todayKey } from "@/lib/dates";

export default function NotesPage() {
  const { actor, visible, classById, selectedId } = useWorkspace();
  const { sessions: allSessions } = useData();
  const sessions = useMemo(() => {
    const ids = new Set(visible.map((c) => c.id));
    return allSessions.filter((s) => ids.has(s.classId));
  }, [allSessions, visible]);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-navy-900">Notes</h1>
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sessions.map((s) => {
            const cls = classById[s.classId];
            return (
              <Link
                key={s.id}
                href={`/notes/${s.classId}/${s.id}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-white transition hover:border-navy-600/60 hover:shadow-[var(--shadow-card)]"
              >
                <div className="relative">
                  <NoteThumbnail classId={s.classId} sessionId={s.id} uid={actor.uid} wrote={s.contributors.includes(actor.uid)} merged={s.merged} />
                  {s.merged && (
                    <span className="chip absolute top-2.5 right-2.5 bg-navy-900 text-white">
                      <Sparkles className="h-3 w-3" /> Class note
                    </span>
                  )}
                </div>
                <div className="px-4 py-3.5">
                  <p className="truncate text-[15px] font-semibold text-navy-900">{s.topic}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cls?.color ?? "#64748b" }} aria-hidden />
                    <span className="truncate">
                      {cls?.course} · {format(fromKey(s.date), "MMM d")} · {s.contributors.length} note{s.contributors.length === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
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
