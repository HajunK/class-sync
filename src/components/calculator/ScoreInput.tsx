"use client";

import clsx from "clsx";
import { useState } from "react";
import { commitScore, letterGrade, parseScore, sanitizeTyping } from "@/lib/calculator/grades";

interface Props {
  /** The stored (original) score. */
  value: number | null;
  /** When this Formative is replaced by a higher Summative, the value shown instead (§4.1). */
  replacedBy?: number | null;
  onCommit: (v: number | null) => void;
  /** Tab / Shift+Tab: move to the next / previous row in the same column. */
  onMove: (dir: 1 | -1) => void;
  inputId: string;
  label: string;
}

const fmt = (v: number | null | undefined) => (v == null ? "" : String(v));

export function GradeChip({ score, faded }: { score: number; faded?: boolean }) {
  const g = letterGrade(score);
  return (
    <span
      className={clsx(
        "inline-flex h-5 min-w-7 items-center justify-center rounded px-1 text-[10px] font-bold",
        g.slug.startsWith("a") ? "bg-emerald-50 text-emerald-700" : g.slug.startsWith("b") ? "bg-blue-50 text-blue-700" : g.slug.startsWith("c") ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700",
        faded && "opacity-40",
      )}
    >
      {g.label}
    </span>
  );
}

export function ScoreInput({ value, replacedBy, onCommit, onMove, inputId, label }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const replaced = replacedBy != null && editing === null;

  function commit() {
    if (editing === null) return;
    const next = parseScore(commitScore(editing));
    setEditing(null);
    if (next !== value) onCommit(next);
  }

  // While typing: preview the grade for plain numbers ≥ 50 (not fractions) — §3.3.
  const typed = editing !== null && !editing.includes("/") && editing !== "" ? Number(editing) : null;
  const shown = editing ?? fmt(replaced ? replacedBy : value);
  const chipScore = typed != null && typed >= 50 ? typed : editing === null ? (replaced ? replacedBy : value) : null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-1">
        <input
          id={inputId}
          aria-label={label}
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          onFocus={(e) => {
            // Editing a replaced row edits the original Formative.
            setEditing(fmt(value));
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => {
            const clean = sanitizeTyping(e.target.value);
            if (clean !== null) setEditing(clean); // rejected keystrokes keep the previous value
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            } else if (e.key === "Tab") {
              e.preventDefault();
              commit();
              onMove(e.shiftKey ? -1 : 1);
            }
          }}
          className={clsx(
            "h-8 w-full rounded-md border bg-white px-2 text-sm tabular-nums outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-900/10",
            replaced ? "border-emerald-300 bg-emerald-50/50 font-semibold text-emerald-800" : "border-line",
          )}
        />
        {replaced && value != null && (
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted" title="Original Formative score">
            {value}
          </span>
        )}
      </div>
      <span className="w-7">{chipScore != null && <GradeChip score={chipScore} faded={typed != null} />}</span>
    </div>
  );
}
