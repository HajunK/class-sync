/**
 * Grade calculator logic — pure functions, no UI.
 * Implements kisj-grade-calculator/docs/CALCULATOR_SPEC.md (§2–§6).
 * Rounding follows the original on purpose (§11 #1–2): the detail line
 * truncates to 2 decimals, while the course grade uses the rounded integer.
 */
import { expandCourseNames, findCourse, type CatalogCourse, COURSE_CATALOG } from "./catalog";

export type GradeSlug =
  | "a-plus" | "a" | "a-minus"
  | "b-plus" | "b" | "b-minus"
  | "c-plus" | "c" | "c-minus"
  | "d-plus" | "d" | "d-minus"
  | "f";

export interface Grade {
  slug: GradeSlug;
  label: string;
}

/* ── constants (§2) ─────────────────────────────────────────── */

export const GRADE_SCALE: (Grade & { min: number })[] = [
  { min: 98, slug: "a-plus", label: "A+" },
  { min: 93, slug: "a", label: "A" },
  { min: 90, slug: "a-minus", label: "A-" },
  { min: 87, slug: "b-plus", label: "B+" },
  { min: 83, slug: "b", label: "B" },
  { min: 80, slug: "b-minus", label: "B-" },
  { min: 77, slug: "c-plus", label: "C+" },
  { min: 73, slug: "c", label: "C" },
  { min: 70, slug: "c-minus", label: "C-" },
  { min: 67, slug: "d-plus", label: "D+" },
  { min: 63, slug: "d", label: "D" },
  { min: 60, slug: "d-minus", label: "D-" },
  { min: 0, slug: "f", label: "F" },
];

export const GPA_SCALE: Record<GradeSlug, number> = {
  "a-plus": 4.0, a: 4.0, "a-minus": 3.667,
  "b-plus": 3.333, b: 3.0, "b-minus": 2.667,
  "c-plus": 2.333, c: 2.0, "c-minus": 1.667,
  "d-plus": 1.333, d: 1.0, "d-minus": 0.667,
  f: 0.0,
};

export const WEIGHTS = {
  withFinal: { F: 20, S: 60, E: 20 },
  withoutFinal: { F: 25, S: 75, E: 0 },
} as const;

export function gradeLabel(slug: GradeSlug | null | undefined): string | null {
  return GRADE_SCALE.find((g) => g.slug === slug)?.label ?? null;
}

/* ── score input (§3) ───────────────────────────────────────── */

/** Digits and the first ".", with at most one decimal place. */
function cleanNumber(s: string) {
  let out = "";
  let dot = false;
  let decimals = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      if (!dot) out += ch;
      else if (decimals < 1) {
        out += ch;
        decimals++;
      }
    } else if (ch === "." && !dot) {
      dot = true;
      out += ch;
    }
  }
  return out;
}

/** Cleans input while typing. Returns null when the keystroke should be rejected (§3.1). */
export function sanitizeTyping(raw: string): string | null {
  const s = raw.replace(/[^0-9./]/g, "");
  const slash = s.indexOf("/");
  if (slash === -1) {
    const n = cleanNumber(s);
    if (n.length >= 2 && n[0] === "0" && n[1] !== ".") return null; // "05", "00"
    if (n !== "" && n !== "." && parseFloat(n) > 100) return null; // "101", "100.5"
    return n;
  }
  // Fractions aren't range-checked while typing; extra "/" are dropped.
  return `${cleanNumber(s.slice(0, slash))}/${cleanNumber(s.slice(slash + 1).replace(/\//g, ""))}`;
}

/** Converts a value when it is committed (blur/Enter/Escape): "" or a 0–100 number string (§3.2). */
export function commitScore(value: string): string {
  if (value.includes("/")) {
    const [n, d] = value.split("/");
    const num = parseFloat(n);
    const den = parseFloat(d);
    if (Number.isNaN(num) || Number.isNaN(den) || den === 0) return "";
    return String(Math.min(100, Math.max(0, Math.round((num / den) * 100))));
  }
  const v = value.replace(/\.$/, "");
  if (v === "" || Number.isNaN(Number(v))) return "";
  return String(Number(v));
}

export function parseScore(committed: string): number | null {
  return committed === "" ? null : Number(committed);
}

/* ── grades ─────────────────────────────────────────────────── */

/** First grade whose minimum the score reaches (no rounding — rows use the raw value). */
export function letterGrade(score: number): Grade {
  const g = GRADE_SCALE.find((x) => score >= x.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { slug: g.slug, label: g.label };
}

/** Display value for FA / SA / D: truncated (not rounded) to 2 decimals (§4.4). */
export function truncate2(v: number): string {
  return (Math.floor(v * 100 + 1e-9) / 100).toFixed(2);
}

/* ── Domain (§4) ────────────────────────────────────────────── */

export interface CourseScores {
  formative: (number | null)[];
  summative: (number | null)[];
  final: (number | null)[];
  /** Rows where the student turned the Formative replacement off. */
  unlinkedRows: number[];
}

export interface DomainResult {
  effectiveFormative: (number | null)[];
  replacedRows: number[];
  qualifyingRows: number[];
  fa: number | null;
  sa: number | null;
  finalAvg: number | null;
  domain: number | null;
  rounded: number | null;
  grade: Grade | null;
  breakdown: "empty" | "single" | "values";
}

const average = (xs: (number | null)[]) => {
  const vals = xs.filter((x): x is number => x != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

export function computeDomain(scores: CourseScores, hasFinal: boolean): DomainResult {
  const F = scores.formative;
  const S = scores.summative;
  const qualifyingRows: number[] = [];
  const replacedRows: number[] = [];

  // §4.1 A higher Summative replaces the Formative in the same row (strictly higher).
  const effectiveFormative = F.map((f, i) => {
    const s = S[i] ?? null;
    if (f == null || s == null || !(s > f)) return f;
    qualifyingRows.push(i);
    if (scores.unlinkedRows.includes(i)) return f;
    replacedRows.push(i);
    return s;
  });

  const fa = average(effectiveFormative);
  const sa = average(S);
  const finalAvg = hasFinal ? average(scores.final) : null;

  // §4.3 Weighted average over the boxes that have scores (weights re-normalized).
  const w = hasFinal ? WEIGHTS.withFinal : WEIGHTS.withoutFinal;
  const parts = ([ [fa, w.F], [sa, w.S], [finalAvg, w.E] ] as [number | null, number][]).filter(([v]) => v != null) as [number, number][];
  const totalWeight = parts.reduce((t, [, wt]) => t + wt, 0);
  const domain = parts.length ? parts.reduce((t, [v, wt]) => t + v * wt, 0) / totalWeight : null;

  const rounded = domain == null ? null : Math.round(domain);
  const grade = rounded == null ? null : letterGrade(rounded);
  const breakdown = domain == null ? "empty" : parts.length === 1 && finalAvg == null ? "single" : "values";

  return { effectiveFormative, replacedRows, qualifyingRows, fa, sa, finalAvg, domain, rounded, grade, breakdown };
}

/* ── GPA (§5) ───────────────────────────────────────────────── */

export interface GpaRow {
  name: string;
  slug: GradeSlug | null;
}

export interface GpaResult {
  unweighted: string;
  weighted: string;
  hasAp: boolean;
}

export function computeGpa(rows: GpaRow[], catalog: CatalogCourse[] = COURSE_CATALOG): GpaResult {
  let unweightedSum = 0;
  let weightedSum = 0;
  let creditTotal = 0;
  let hasAp = false;

  for (const row of rows) {
    const course = findCourse(row.name, catalog);
    const isAp = course ? course.ap : false;
    if (isAp) hasAp = true; // even without a grade
    if (row.slug == null) continue;
    const points = GPA_SCALE[row.slug];
    if (points === undefined) continue;
    const credit = course ? course.weight : 1; // unknown course → 1 credit
    if (credit === 0) continue; // Lunch etc.
    unweightedSum += points * credit;
    weightedSum += (points + (isAp ? 1.0 : 0)) * credit;
    creditTotal += credit;
  }

  return {
    unweighted: creditTotal > 0 ? (unweightedSum / creditTotal).toFixed(4) : "-",
    weighted: creditTotal > 0 ? (weightedSum / creditTotal).toFixed(4) : "-",
    hasAp,
  };
}

/**
 * GPA rows for the student's courses (combos expanded, §5.1). Each row's grade
 * is the one saved on the GPA tab, else the current Domain grade, else unset.
 */
export function buildGpaRows(
  courseNames: string[],
  saved: GpaRow[],
  domainGrades: Record<string, GradeSlug | null>,
  catalog: CatalogCourse[] = COURSE_CATALOG,
): GpaRow[] {
  return expandCourseNames(courseNames, catalog).map((name) => {
    // A choice made on the GPA tab wins — including clearing it with ×.
    const own = saved.find((r) => r.name === name);
    return { name, slug: own ? own.slug : (domainGrades[name] ?? null) };
  });
}

/** "Paste from Domain" — overwrites only rows that have a Domain grade (§6.2, §11 #5). */
export function pasteFromDomain(rows: GpaRow[], domainGrades: Record<string, GradeSlug | null>): GpaRow[] {
  return rows.map((r) => (domainGrades[r.name] ? { ...r, slug: domainGrades[r.name] } : r));
}
