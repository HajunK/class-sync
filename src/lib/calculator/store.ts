"use client";

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import type { CourseScores, GpaRow } from "./grades";

/** Everything the calculator saves for one student. Private: only they can read it. */
export interface CalculatorState {
  /** Catalog course names the student added, in order (combos not expanded). */
  courses: string[];
  /** Scores per course card (combo sub-courses get their own card). */
  domainScores: Record<string, CourseScores>;
  /** Grades set by hand on the GPA tab. */
  gpaClasses: GpaRow[];
}

const EMPTY: CalculatorState = { courses: [], domainScores: {}, gpaClasses: [] };
const SAVE_DELAY_MS = 800;

/** Drop trailing empty rows so we don't store long runs of nulls. */
function trim(xs: (number | null)[]) {
  let end = xs.length;
  while (end > 0 && xs[end - 1] == null) end--;
  return xs.slice(0, end);
}

function forSaving(state: CalculatorState) {
  const domainScores: Record<string, CourseScores> = {};
  for (const [name, s] of Object.entries(state.domainScores)) {
    domainScores[name] = {
      formative: trim(s.formative),
      summative: trim(s.summative),
      final: trim(s.final),
      unlinkedRows: s.unlinkedRows,
    };
  }
  return { courses: state.courses, domainScores, gpaClasses: state.gpaClasses, updatedAt: serverTimestamp() };
}

/**
 * The student's calculator data, kept live. Updates apply to the screen
 * immediately and are saved to Firestore shortly after the last change.
 */
export function useCalculatorState(uid: string) {
  const [state, setState] = useState<CalculatorState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"saved" | "pending" | "error">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<CalculatorState>(EMPTY);
  const ref = doc(db, "users", uid, "calculator", "state");

  useEffect(() => {
    return onSnapshot(
      doc(db, "users", uid, "calculator", "state"),
      (snap) => {
        // Don't overwrite local edits that haven't been saved yet.
        if (timer.current) return;
        const data = snap.exists() ? (snap.data() as Partial<CalculatorState>) : {};
        const next = { courses: data.courses ?? [], domainScores: data.domainScores ?? {}, gpaClasses: data.gpaClasses ?? [] };
        latest.current = next;
        setState(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uid]);

  const save = useCallback(async () => {
    timer.current = null;
    try {
      await setDoc(ref, forSaving(latest.current));
      setSaving(timer.current ? "pending" : "saved");
    } catch {
      setSaving("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const update = useCallback(
    (fn: (s: CalculatorState) => CalculatorState) => {
      const next = fn(latest.current);
      latest.current = next;
      setState(next);
      setSaving("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, SAVE_DELAY_MS);
    },
    [save],
  );

  // Save anything pending when leaving the page.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        setDoc(ref, forSaving(latest.current)).catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  );

  return { state, loading, saving, update };
}
