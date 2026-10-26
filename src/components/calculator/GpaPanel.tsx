"use client";

import clsx from "clsx";
import { ClipboardPaste, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { findCourse } from "@/lib/calculator/catalog";
import { computeGpa, gradeLabel, GRADE_SCALE, type GpaRow, type GradeSlug } from "@/lib/calculator/grades";

export function GpaPanel({
  rows,
  onSetGrade,
  onPasteFromDomain,
  domainGradeCount,
}: {
  rows: GpaRow[];
  onSetGrade: (name: string, slug: GradeSlug | null) => void;
  onPasteFromDomain: () => void;
  domainGradeCount: number;
}) {
  const result = computeGpa(rows);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="card divide-y divide-line">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-semibold text-navy-900">Courses</p>
          <button className="btn btn-outline btn-sm" onClick={onPasteFromDomain} disabled={domainGradeCount === 0} title="Use the grades from the Domain tab">
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste from Domain
          </button>
        </div>
        {rows.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted">Add your courses below to calculate your GPA.</p>}
        {rows.map((row, i) => {
          const course = findCourse(row.name);
          const credit = course ? course.weight : 1;
          return (
            <div key={`${row.name}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-900">{row.name}</p>
                <p className="text-[11px] text-muted">
                  {credit} credit{credit === 1 ? "" : "s"}
                  {course?.ap && <span className="ml-1.5 rounded bg-gold-100 px-1 font-bold text-gold-600">AP +1.0</span>}
                  {credit === 0 && " · not counted"}
                </p>
              </div>
              <GradePicker value={row.slug} onChange={(slug) => onSetGrade(row.name, slug)} />
            </div>
          );
        })}
      </div>

      <div className="card h-fit p-5 lg:sticky lg:top-[90px]">
        {result.hasAp ? (
          <div className="grid grid-cols-2 gap-6 text-center">
            <Stat label="Unweighted" value={result.unweighted} />
            <Stat label="Weighted" value={result.weighted} />
          </div>
        ) : (
          <Stat label="Unweighted / Weighted" value={result.unweighted} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-heading text-4xl font-extrabold text-navy-900 tabular-nums">{value}</p>
    </div>
  );
}

/** Click to pick, mouse wheel to step one grade at a time, × to clear (§5.3). */
function GradePicker({ value, onChange }: { value: GradeSlug | null; onChange: (s: GradeSlug | null) => void }) {
  const [open, setOpen] = useState(false);
  // Opens upward when there isn't room below it on screen.
  const [up, setUp] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wheel = useRef({ acc: 0, until: 0 });
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const close = (e: MouseEvent) => boxRef.current && !boxRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Non-passive listener so the page doesn't scroll while changing a grade.
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now < wheel.current.until) return;
      wheel.current.acc += e.deltaY;
      if (Math.abs(wheel.current.acc) < 40) return;
      const down = wheel.current.acc > 0;
      wheel.current = { acc: 0, until: now + 120 };
      const idx = GRADE_SCALE.findIndex((g) => g.slug === valueRef.current);
      // Unset starts at A+; down = lower grade, up = higher; stops at A+ and F.
      const next = idx === -1 ? 0 : Math.min(GRADE_SCALE.length - 1, Math.max(0, idx + (down ? 1 : -1)));
      if (GRADE_SCALE[next].slug !== valueRef.current) onChangeRef.current(GRADE_SCALE[next].slug);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="relative flex items-center gap-1" ref={boxRef}>
      <button
        ref={btnRef}
        onClick={() => {
          if (!open) setUp(window.innerHeight - (boxRef.current?.getBoundingClientRect().bottom ?? 0) < 230);
          setOpen((o) => !o);
        }}
        className={clsx(
          "h-8 w-14 rounded-md border text-sm font-bold transition",
          value ? "border-navy-900 bg-navy-900 text-gold-500" : "border-dashed border-line text-muted hover:border-navy-900/30",
        )}
        title="Click to choose, or scroll to change"
      >
        {gradeLabel(value) ?? "—"}
      </button>
      <button
        onClick={() => onChange(null)}
        className={clsx("rounded p-1 text-muted hover:text-red-600", !value && "invisible")}
        aria-label="Clear grade"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className={clsx("absolute right-6 z-20 grid w-48 grid-cols-3 gap-1 rounded-xl border border-line bg-white p-2 shadow-[var(--shadow-lift)]", up ? "bottom-9" : "top-9")}>
          {GRADE_SCALE.map((g) => (
            <button
              key={g.slug}
              onClick={() => {
                onChange(g.slug);
                setOpen(false);
              }}
              className={clsx("rounded-md py-1.5 text-sm font-semibold", g.slug === value ? "bg-navy-900 text-gold-500" : "text-navy-900 hover:bg-paper")}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
