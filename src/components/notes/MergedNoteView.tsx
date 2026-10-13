"use client";

import { GitCompareArrows } from "lucide-react";
import type { MergedNote } from "@/lib/types";

export interface SourceInfo {
  label: string;
  name: string;
  color: string;
}

function SourceChips({
  ids,
  sources,
  onSourceClick,
}: {
  ids: string[];
  sources: Record<string, SourceInfo>;
  onSourceClick: (noteId: string) => void;
}) {
  return (
    <>
      {ids.map((id) =>
        sources[id] ? (
          <button
            key={id}
            onClick={() => onSourceClick(id)}
            className="ml-1 inline-flex -translate-y-px rounded px-1 align-middle text-[10px] leading-4 font-bold text-white hover:opacity-80"
            style={{ background: sources[id].color }}
            title={`From ${sources[id].name}'s note`}
          >
            {sources[id].label}
          </button>
        ) : null,
      )}
    </>
  );
}

/** Side panel next to the class note, like comments in the margin of a doc. */
export function ConflictPanel({
  merged,
  sources,
  onSourceClick,
}: {
  merged: MergedNote;
  sources: Record<string, SourceInfo>;
  onSourceClick: (noteId: string) => void;
}) {
  if (!merged.conflicts.length) return null;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 px-1 text-sm font-semibold text-amber-900">
        <GitCompareArrows className="h-4 w-4" /> Notes disagree on {merged.conflicts.length} point{merged.conflicts.length === 1 ? "" : "s"}
      </p>
      {merged.conflicts.map((c, i) => (
        <div key={i} className="rounded-lg border-l-4 border-amber-400 bg-white p-3.5 text-sm shadow-[var(--shadow-card)]">
          <p className="font-semibold text-navy-900">{c.topic}</p>
          <ul className="mt-2 space-y-1.5">
            {c.versions.map((v, j) => (
              <li key={j} className="rounded-md bg-amber-50 px-2.5 py-1.5 text-ink/85">
                “{v.text}”
                <SourceChips ids={[v.source]} sources={sources} onSourceClick={onSourceClick} />
              </li>
            ))}
          </ul>
          {c.note && <p className="mt-2 text-xs text-muted">{c.note}</p>}
        </div>
      ))}
    </div>
  );
}

/** The AI-merged class note. Every line links back to the classmates' notes it came from. */
export function MergedNoteView({
  merged,
  sources,
  onSourceClick,
}: {
  merged: MergedNote;
  sources: Record<string, SourceInfo>;
  onSourceClick: (noteId: string) => void;
}) {
  const Chips = ({ ids }: { ids: string[] }) => <SourceChips ids={ids} sources={sources} onSourceClick={onSourceClick} />;

  return (
    <div className="doc">
      <h1>{merged.title}</h1>
      {merged.overview && <p className="text-muted">{merged.overview}</p>}

      {merged.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <ul>
            {s.items.map((it, j) => (
              <li key={j}>
                {it.kind === "test" && <span className="mr-1 rounded bg-gold-500 px-1 text-[10px] font-bold text-navy-900 uppercase">Test</span>}
                {it.kind === "definition" && <span className="mr-1 text-[10px] font-bold text-navy-700 uppercase">Def.</span>}
                {it.kind === "example" && <span className="mr-1 text-[10px] font-bold text-emerald-700 uppercase">Ex.</span>}
                {it.text}
                <Chips ids={it.sources} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {merged.keyTerms.length > 0 && (
        <section>
          <h2>Key terms</h2>
          <ul>
            {merged.keyTerms.map((k, i) => (
              <li key={i}>
                <strong>{k.term}</strong> — {k.definition}
                <Chips ids={k.sources} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
