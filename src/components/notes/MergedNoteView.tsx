"use client";

import { GitCompareArrows } from "lucide-react";
import { contributionShares, roundPercents } from "@/lib/merge/contributions";
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

const DONUT = { size: 120, radius: 44, stroke: 18 };

/** Who wrote how much of the class note: a donut with each student's share, in the colors used on the source tags. */
function ContributionDonut({ merged, sources }: { merged: MergedNote; sources: Record<string, SourceInfo> }) {
  // Only students whose note is still around, with their percents re-rounded to add up to 100.
  const known = contributionShares(merged).filter((s) => sources[s.id]);
  if (known.length < 2) return null;
  const percents = roundPercents(known.map((s) => s.percent));
  const shares = known.map((s, i) => ({ ...sources[s.id], percent: percents[i] })).filter((s) => s.percent > 0);
  if (shares.length < 2) return null;

  const { size, radius, stroke } = DONUT;
  const circumference = 2 * Math.PI * radius;
  const gap = 2;
  // Where each arc begins, as a length along the circle.
  const arcs = shares.map((s, i) => ({
    ...s,
    length: (s.percent / 100) * circumference,
    start: (shares.slice(0, i).reduce((sum, o) => sum + o.percent, 0) / 100) * circumference,
  }));
  return (
    <div className="mt-8 flex justify-end">
      <figure className="flex items-center gap-5 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-navy-50)" />
              {arcs.map((s) => (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={s.color}
                  strokeDasharray={`${Math.max(s.length - gap, 0.5)} ${circumference}`}
                  strokeDashoffset={-s.start}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="font-heading text-2xl font-extrabold text-navy-900">{shares.length}</span>
            <span className="text-[11px] text-muted">students</span>
          </div>
        </div>
        <figcaption className="min-w-[10rem]">
          <p className="text-sm font-semibold text-navy-900">Who contributed</p>
          <ul className="mt-2 space-y-1.5">
            {shares.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="max-w-[9rem] truncate text-ink">{s.name}</span>
                <span className="ml-auto pl-3 font-semibold text-navy-900 tabular-nums">{s.percent}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[11px] text-muted">Share of the information, estimated by AI</p>
        </figcaption>
      </figure>
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
    <>
    <div className="doc">
      <h1>{merged.title}</h1>
      {merged.overview && <p className="text-muted">{merged.overview}</p>}

      {merged.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <ul>
            {s.items.map((it, j) => (
              <li key={j}>
                {it.kind === "test" && <span className="mr-1 rounded bg-navy-100 px-1 text-[10px] font-bold text-navy-900 uppercase">Test</span>}
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
    <ContributionDonut merged={merged} sources={sources} />
    </>
  );
}
