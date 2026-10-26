"use client";

import clsx from "clsx";
import { Link2, Unlink2, X } from "lucide-react";
import { useMemo } from "react";
import { computeDomain, scoreNeededForA, truncate2, WEIGHTS, type CourseScores } from "@/lib/calculator/grades";
import { ScoreInput } from "./ScoreInput";

const MIN_ROWS = 8;

/** Placeholder text for an empty box: what it takes to get an A. No hint when even 100 isn't enough. */
function aHint(needed: number | null) {
  if (needed == null) return undefined;
  return needed === 0 ? "Stays an A" : `${needed} for A`;
}

export const emptyScores = (): CourseScores => ({ formative: [], summative: [], final: [], unlinkedRows: [] });

/** Rows shown: at least 8, and always one empty row after the last score (§10). */
function rowCount(s: CourseScores) {
  let last = -1;
  for (let i = Math.max(s.formative.length, s.summative.length) - 1; i >= 0; i--) {
    if (s.formative[i] != null || s.summative[i] != null) {
      last = i;
      break;
    }
  }
  return Math.max(MIN_ROWS, last + 2);
}

function setAt(xs: (number | null)[], i: number, v: number | null) {
  const out = xs.slice();
  while (out.length <= i) out.push(null);
  out[i] = v;
  return out;
}

export function DomainCard({
  id,
  name,
  hasFinal,
  scores,
  onChange,
  onRemove,
  example,
  message,
}: {
  id: string;
  name: string;
  hasFinal: boolean;
  scores: CourseScores;
  onChange: (s: CourseScores) => void;
  onRemove?: () => void;
  example?: boolean;
  /** A short encouraging line shown under the grade breakdown. */
  message?: string;
}) {
  const r = useMemo(() => computeDomain(scores, hasFinal), [scores, hasFinal]);
  const rows = rowCount(scores);
  // For each empty box, the score that would make the course an A.
  const hints = useMemo(() => {
    const row = (box: "formative" | "summative") => {
      const all = Array.from({ length: rowCount(scores) }, (_, i) => (scores[box][i] == null ? aHint(scoreNeededForA(scores, hasFinal, box, i)) : undefined));
      // Only the first of a run of identical hints is shown.
      return all.map((h, i) => (i > 0 && h === all[i - 1] ? undefined : h));
    };
    return {
      formative: row("formative"),
      summative: row("summative"),
      final: scores.final[0] == null && hasFinal ? aHint(scoreNeededForA(scores, hasFinal, "final", 0)) : undefined,
    };
  }, [scores, hasFinal]);
  const w = hasFinal ? WEIGHTS.withFinal : WEIGHTS.withoutFinal;

  function commit(box: "formative" | "summative", i: number, v: number | null) {
    const next = { ...scores, [box]: setAt(scores[box], i, v) };
    // Clearing either side of a row resets its link choice (§4.1).
    if (v == null) next.unlinkedRows = scores.unlinkedRows.filter((x) => x !== i);
    onChange(next);
  }

  function toggleLink(i: number) {
    const off = scores.unlinkedRows.includes(i);
    onChange({ ...scores, unlinkedRows: off ? scores.unlinkedRows.filter((x) => x !== i) : [...scores.unlinkedRows, i] });
  }

  const focus = (col: string, i: number) => document.getElementById(`${id}-${col}-${i}`)?.focus();

  return (
    <div className="card overflow-hidden">
      {/* summary */}
      <div className="flex items-start gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-semibold text-navy-900">
            {name}
            {example && <span className="chip bg-paper text-muted">Example</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {r.breakdown === "empty"
              ? "No grades yet"
              : r.breakdown === "single"
                ? r.fa != null
                  ? `Formative Average ${truncate2(r.fa)}`
                  : `Summative Average ${truncate2(r.sa!)}`
                : `FA ${r.fa == null ? "-" : truncate2(r.fa)} | SA ${r.sa == null ? "-" : truncate2(r.sa)} | D ${truncate2(r.domain!)}`}
          </p>
          {message && <p className="mt-1 animate-[fade-in_0.5s_ease-out_both] text-xs font-medium text-navy-700">{message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-heading text-3xl font-extrabold text-navy-900 tabular-nums">{r.rounded ?? "--"}</span>
          {r.grade && <span className="rounded-lg bg-navy-900 px-2 py-1 text-sm font-bold text-gold-500">{r.grade.label}</span>}
          {onRemove && (
            <button onClick={onRemove} className="ml-1 rounded p-1 text-muted hover:bg-paper hover:text-red-600" aria-label={`Remove ${name}`} title="Remove course">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Formatives | link | Summatives */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-x-2 gap-y-1.5">
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Formatives · {w.F}%</p>
          <span />
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Summatives · {w.S}%</p>
          {Array.from({ length: rows }, (_, i) => {
            const qualifies = r.qualifyingRows.includes(i);
            const replaced = r.replacedRows.includes(i);
            return (
              <div key={i} className="contents">
                <ScoreInput
                  inputId={`${id}-F-${i}`}
                  label={`${name} formative ${i + 1}`}
                  value={scores.formative[i] ?? null}
                  placeholder={hints.formative[i]}
                  replacedBy={replaced ? scores.summative[i] : null}
                  onCommit={(v) => commit("formative", i, v)}
                  onMove={(d) => focus("F", i + d)}
                />
                {qualifies ? (
                  <button
                    onClick={() => toggleLink(i)}
                    className={clsx("flex h-7 w-7 items-center justify-center rounded-md transition", replaced ? "bg-emerald-50 text-emerald-700" : "text-muted hover:bg-paper")}
                    title={replaced ? "Summative replaces this Formative — click to turn off" : "Click to let the higher Summative replace this Formative"}
                    aria-label={replaced ? "Turn off replacement" : "Turn on replacement"}
                  >
                    {replaced ? <Link2 className="h-4 w-4" /> : <Unlink2 className="h-4 w-4" />}
                  </button>
                ) : (
                  <span />
                )}
                <ScoreInput
                  inputId={`${id}-S-${i}`}
                  label={`${name} summative ${i + 1}`}
                  value={scores.summative[i] ?? null}
                  placeholder={hints.summative[i]}
                  onCommit={(v) => commit("summative", i, v)}
                  onMove={(d) => focus("S", i + d)}
                />
              </div>
            );
          })}
        </div>

        {hasFinal && (
          <div className="mt-4 max-w-[calc(50%-18px)]">
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Final Exam · {w.E}%</p>
            <ScoreInput
              inputId={`${id}-E-0`}
              label={`${name} final exam`}
              value={scores.final[0] ?? null}
              placeholder={hints.final}
              onCommit={(v) => onChange({ ...scores, final: v == null ? [] : [v] })}
              onMove={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
