"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ConflictPanel, MergedNoteView, type SourceInfo } from "@/components/notes/MergedNoteView";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Modal, PageLoader, Spinner } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { renameSession, saveMergedNote, saveMyNote, useNotes, useSession } from "@/lib/db";
import { fromKey, timeAgo, tsToDate } from "@/lib/dates";
import { postWithAuth } from "@/lib/api";
import type { MergedNote } from "@/lib/types";

const COLORS = ["#2357c6", "#0f8a6b", "#c2410c", "#7c3aed", "#be185d", "#0e7490", "#b88a00", "#475569"];

export default function NotePage() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const { actor, classById } = useWorkspace();
  const cls = classById[classId];
  const { data: session, loading } = useSession(classId, sessionId);
  const { data: notes, loading: notesLoading } = useNotes(classId, sessionId);
  const [tab, setTab] = useState<"mine" | "class">("mine");
  const [viewing, setViewing] = useState<string | null>(null);

  if (loading || notesLoading) return <PageLoader />;
  if (!session || !cls)
    return (
      <div className="p-10 text-center text-muted">
        This note isn&apos;t available.{" "}
        <Link href="/notes" className="font-semibold text-navy-900 underline">
          Back to notes
        </Link>
      </div>
    );

  const myNote = notes.find((n) => n.id === actor.uid);
  const written = notes.filter((n) => n.text.trim());

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <div className="sticky top-16 z-20 border-b border-line bg-white px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/notes" className="rounded-full p-1.5 text-muted hover:bg-paper hover:text-navy-900" aria-label="Back to notes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <TitleInput key={session.topic} value={session.topic} onSave={(t) => renameSession(classId, sessionId, t)} />
            <p className="px-1 text-xs text-muted">
              {cls.course} · {format(fromKey(session.date), "EEE, MMM d")}
            </p>
          </div>
          <div className="flex rounded-lg bg-paper p-1 text-sm font-semibold">
            <button onClick={() => setTab("mine")} className={clsx("rounded-md px-3 py-1.5", tab === "mine" ? "bg-white text-navy-900 shadow-sm" : "text-muted")}>
              My note
            </button>
            <button
              onClick={() => setTab("class")}
              className={clsx("flex items-center gap-1.5 rounded-md px-3 py-1.5", tab === "class" ? "bg-white text-navy-900 shadow-sm" : "text-muted")}
            >
              <Sparkles className="h-3.5 w-3.5 text-gold-600" /> Class note
            </button>
          </div>
        </div>
      </div>

      <div className={clsx("mx-auto px-3 py-6 sm:px-6", tab === "class" && session.merged?.conflicts.length ? "max-w-6xl" : "max-w-[860px]")}>
        {tab === "mine" ? (
          <MyNote key={sessionId} initialHtml={myNote?.html ?? ""} save={(html, text) => saveMyNote(actor, classId, sessionId, html, text)} />
        ) : (
          <ClassNote
            notes={written}
            merged={session.merged ?? null}
            onView={setViewing}
            merge={async () => {
              const { result } = await postWithAuth<{ result: MergedNote }>("/api/merge-notes", {
                course: `${cls.course} (${cls.section})`,
                topic: session.topic,
                date: session.date,
                notes: written.map((n) => ({ id: n.id, authorName: n.authorName, content: n.text })),
              });
              await saveMergedNote(actor, classId, sessionId, result);
            }}
          />
        )}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`${notes.find((n) => n.id === viewing)?.authorName ?? ""}'s note`} wide>
        {viewing && <NoteEditor key={viewing} content={notes.find((n) => n.id === viewing)?.html ?? ""} editable={false} />}
      </Modal>
    </div>
  );
}

function TitleInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() !== value && onSave(v)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="w-full rounded px-1 font-serif text-lg font-semibold text-navy-900 outline-none hover:bg-paper focus:bg-paper"
      aria-label="Lesson topic"
    />
  );
}

/** The student's own note, saved automatically while they type. */
function MyNote({ initialHtml, save }: { initialHtml: string; save: (html: string, text: string) => Promise<void> }) {
  const [status, setStatus] = useState<"saved" | "editing" | "saving" | "error">("saved");
  const pending = useRef<{ html: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  const flush = async () => {
    if (!pending.current) return;
    const { html, text } = pending.current;
    pending.current = null;
    setStatus("saving");
    try {
      await saveRef.current(html, text);
      setStatus(pending.current ? "editing" : "saved");
    } catch {
      setStatus("error");
    }
  };

  // Save anything still pending when leaving the page.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) saveRef.current(pending.current.html, pending.current.text).catch(() => {});
    },
    [],
  );

  return (
    <div>
      <p className="mb-2 text-right text-xs text-muted">
        {status === "saving" ? "Saving…" : status === "editing" ? "Editing…" : status === "error" ? "Couldn't save — check your connection" : "All changes saved"}
      </p>
      <div className="rounded-lg bg-white px-6 pt-4 pb-10 shadow-[var(--shadow-card)] sm:px-14">
        <NoteEditor
          content={initialHtml}
          onChange={(html, text) => {
            pending.current = { html, text };
            setStatus("editing");
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, 800);
          }}
        />
      </div>
    </div>
  );
}

function ClassNote({
  notes,
  merged,
  onView,
  merge,
}: {
  notes: { id: string; authorName: string }[];
  merged: MergedNote | null;
  onView: (id: string) => void;
  merge: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const sources = useMemo(() => {
    const out: Record<string, SourceInfo> = {};
    notes.forEach((n, i) => (out[n.id] = { label: `N${i + 1}`, name: n.authorName, color: COLORS[i % COLORS.length] }));
    return out;
  }, [notes]);
  const stale = merged && notes.some((n) => !merged.sourceNoteIds.includes(n.id));

  async function run() {
    setBusy(true);
    try {
      await merge();
      toast.success("Class note updated.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]">
        <span className="text-muted">{notes.length ? "Written by:" : "No one has written a note yet."}</span>
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => onView(n.id)}
            className="flex items-center gap-1.5 rounded-full border border-line py-0.5 pr-2.5 pl-0.5 text-xs hover:border-navy-900/30"
            title="View this note"
          >
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: sources[n.id].color }}>
              {sources[n.id].label}
            </span>
            {n.authorName}
          </button>
        ))}
        <button className="btn btn-gold btn-sm ml-auto" onClick={run} disabled={busy || notes.length === 0}>
          {busy ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? "Merging…" : merged ? "Update with AI" : `Merge ${notes.length} note${notes.length === 1 ? "" : "s"} with AI`}
        </button>
      </div>

      {merged && (
        <p className="px-1 text-xs text-muted">
          {merged.engine === "openai" ? `Merged by AI (${merged.model})` : merged.engine === "sample" ? "Sample class note (demo data)" : "Merged offline (no API key)"}
          {merged.mergedByName ? ` · ${merged.mergedByName}` : ""} · {timeAgo(tsToDate(merged.mergedAt))}
          {stale && <span className="ml-2 font-semibold text-gold-600">· New notes were added since — update to include them</span>}
        </p>
      )}

      <div className={clsx("grid grid-cols-1 gap-5", merged?.conflicts.length && "lg:grid-cols-[minmax(0,1fr)_300px]", busy && "opacity-50")}>
        <div className="rounded-lg bg-white px-6 pt-4 pb-10 shadow-[var(--shadow-card)] sm:px-14">
          {merged ? (
            <MergedNoteView merged={merged} sources={sources} onSourceClick={onView} />
          ) : (
            <div className="py-16 text-center text-muted">
              <Sparkles className="mx-auto h-8 w-8 text-gold-500" />
              <p className="mt-3 font-semibold text-navy-900">No class note yet</p>
              <p className="mt-1 text-sm">AI combines everyone&apos;s notes into one, removes repeats, and marks where notes disagree.</p>
            </div>
          )}
        </div>
        {merged && merged.conflicts.length > 0 && (
          <aside className="order-first lg:order-none">
            <div className="lg:sticky lg:top-[140px]">
              <ConflictPanel merged={merged} sources={sources} onSourceClick={onView} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
