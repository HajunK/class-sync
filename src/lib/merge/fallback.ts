/**
 * Offline "demo merge" used when no OPENAI_API_KEY is configured.
 *
 * It is a simple line-based heuristic — not as smart as the AI — but it shows
 * the full flow: every line is kept, near-duplicates are folded together with
 * all their sources, and lines that look alike but contain different numbers
 * are reported as conflicts.
 */
import type { MergedConflict, MergedItem, MergedItemKind, MergedSection } from "../types";
import type { MergeInputNote, MergeRequest, MergeResult } from "./shared";

const STOPWORDS = new Set(
  "a an the of and or to in on at for is are was were be by with as it this that these those from into than then so if not no do does did".split(
    " ",
  ),
);

interface Line {
  heading: string;
  text: string;
  kind: MergedItemKind;
  source: string;
}

interface Bucket {
  key: string;
  heading: string;
  items: (MergedItem & { tokens: Set<string>; numbers: string; qty: Record<string, string>; conflicted?: boolean })[];
}

const TEST_RE = /(on the (test|quiz|exam)|will be (tested|on)|\btest\b|\bexam\b|\bquiz\b|important|remember|★|⭐|!!|중요|시험|퀴즈)/i;
const EXAMPLE_RE = /^(e\.g\.|eg[:.]|ex(ample)?\s*\d*[:.)]|예시?[:)]|sample)/i;
const DEF_RE = /(\bis defined as\b|\bmeans\b|\brefers to\b|^[^:=]{2,40}\s*(:|=|—|–)\s+\S)/i;

function stripBullet(s: string) {
  return s.replace(/^\s*([-*•·▪︎◦>]|\d+[.)]|[a-z][.)])\s+/i, "").trim();
}

function isHeading(raw: string, next?: string) {
  const s = raw.trim();
  if (/^#{1,6}\s+/.test(s)) return true;
  if (s.length <= 60 && /:\s*$/.test(s) && !/^\s*([-*•]|\d+[.)])/.test(s)) return true;
  if (s.length <= 40 && s === s.toUpperCase() && /[A-Z]{3}/.test(s)) return true;
  return Boolean(next && /^\s*([-*•]|\d+[.)])\s/.test(next) && s.length <= 50 && !/[.!?]$/.test(s) && !/^\s*([-*•]|\d+[.)])/.test(s));
}

function cleanHeading(s: string) {
  return s.replace(/^#{1,6}\s+/, "").replace(/:\s*$/, "").trim();
}

function tokens(s: string) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w && !STOPWORDS.has(w) && !/^\d+$/.test(w)),
  );
}

function numbers(s: string) {
  return (s.match(/\d+(?:[.,/:]\d+)*/g) || []).sort().join("|");
}

/** "3 phosphate groups" → { phosphate: "3" }: which quantity each number describes. */
function quantities(s: string) {
  const out: Record<string, string> = {};
  const re = /(\d+(?:[.,]\d+)?)\s*(?:-\s*)?([\p{L}]{3,})/gu;
  for (const m of s.toLowerCase().matchAll(re)) out[m[2]] = m[1];
  // "Total = 36 ATP" / "~38 ATP" also count; "ATP: 36" style
  for (const m of s.toLowerCase().matchAll(/([\p{L}]{3,})\s*(?:=|:|is|of)\s*~?(\d+(?:[.,]\d+)?)/gu)) out[m[1]] ??= m[2];
  return out;
}

function clashingQuantity(a: Record<string, string>, b: Record<string, string>) {
  for (const k of Object.keys(a)) if (k in b && a[k] !== b[k]) return k;
  return null;
}

/** Words around the numbers — what the quantity is about ("total … glucose" vs "payoff"). */
function context(t: Set<string>, ...qty: Record<string, string>[]) {
  const skip = new Set(qty.flatMap((x) => Object.keys(x)));
  return new Set([...t].filter((w) => !skip.has(w)));
}

function overlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / Math.min(a.size, b.size);
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

function parse(note: MergeInputNote): Line[] {
  const raw = note.content.split(/\r?\n/);
  const out: Line[] = [];
  let heading = "";
  raw.forEach((line, i) => {
    if (!line.trim()) return;
    if (isHeading(line, raw[i + 1])) {
      heading = cleanHeading(line);
      return;
    }
    const text = stripBullet(line);
    if (text.length < 2) return;
    let kind: MergedItemKind = "point";
    if (TEST_RE.test(text)) kind = "test";
    else if (EXAMPLE_RE.test(text)) kind = "example";
    else if (DEF_RE.test(text)) kind = "definition";
    out.push({ heading, text, kind, source: note.id });
  });
  return out;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const ASSESSMENT_RE = /\b(quiz|test|exam|midterm|final|essay|lab|report|project|assignment|homework|due)\b/i;

/** "Quiz Friday!" in one note vs "quiz next Thursday" in another. */
function weekdayConflicts(notes: MergeInputNote[]): MergedConflict[] {
  const mentions: { source: string; text: string; day: string; what: string }[] = [];
  for (const note of notes) {
    for (const raw of note.content.split(/\r?\n/)) {
      const text = stripBullet(raw);
      const lower = text.toLowerCase();
      const day = WEEKDAYS.find((d) => new RegExp(`\\b${d}\\b`).test(lower));
      const what = lower.match(ASSESSMENT_RE)?.[1];
      if (day && what) mentions.push({ source: note.id, text, day, what });
    }
  }
  const out: MergedConflict[] = [];
  const seen = new Set<string>();
  for (const a of mentions)
    for (const b of mentions) {
      if (a.source >= b.source || a.what !== b.what || a.day === b.day) continue;
      const k = `${a.what}:${[a.day, b.day].sort().join("-")}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        topic: `When is the ${a.what}?`,
        versions: [
          { source: a.source, text: a.text },
          { source: b.source, text: b.text },
        ],
        note: "These notes name different days. Check the class calendar or ask the teacher.",
      });
    }
  return out;
}

/** Conflicts the offline checker finds that the AI result doesn't already cover. */
export function extraConflicts(req: MergeRequest, existing: MergedConflict[]): MergedConflict[] {
  const covered = existing.map((c) => c.versions.map((v) => v.text.toLowerCase()).join(" "));
  return mergeOffline(req).conflicts.filter((c) => {
    const keys = c.versions.flatMap((v) => (v.text.toLowerCase().match(/\d+(?:[.,]\d+)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday/g) || []));
    return !covered.some((text) => keys.length > 0 && keys.every((k) => text.includes(k)));
  });
}

export function mergeOffline(req: MergeRequest): MergeResult {
  const buckets: Bucket[] = [];
  const conflicts: MergedConflict[] = [];
  let duplicates = 0;

  const bucketFor = (heading: string) => {
    const label = heading || "Main points";
    const t = tokens(label);
    let b = buckets.find((x) => x.key === label.toLowerCase() || jaccard(tokens(x.heading), t) >= 0.5);
    if (!b) {
      b = { key: label.toLowerCase(), heading: label, items: [] };
      buckets.push(b);
    }
    return b;
  };

  for (const note of req.notes) {
    for (const line of parse(note)) {
      const t = tokens(line.text);
      const n = numbers(line.text);
      const q = quantities(line.text);
      let handled = false;

      for (const b of buckets) {
        for (const item of b.items) {
          const sim = jaccard(item.tokens, t);
          if (sim >= 0.6 && item.numbers === n) {
            if (!item.sources.includes(line.source)) item.sources.push(line.source);
            if (line.text.length > item.text.length) item.text = line.text;
            if (line.kind === "test") item.kind = "test";
            duplicates++;
            handled = true;
          } else if (
            !item.sources.includes(line.source) &&
            item.numbers &&
            n &&
            item.numbers !== n &&
            (sim >= 0.4 || (clashingQuantity(item.qty, q) && overlap(context(item.tokens, item.qty, q), context(t, item.qty, q)) >= 0.5))
          ) {
            const unit = clashingQuantity(item.qty, q);
            const shared = [...item.tokens].filter((w) => t.has(w)).slice(0, 4).join(" ");
            const topic = unit ? `Different numbers for “${unit}”` : shared ? `Different values: ${shared}` : "Values differ";
            conflicts.push({
              topic: topic.charAt(0).toUpperCase() + topic.slice(1),
              versions: [
                { source: item.sources[0], text: item.text },
                { source: line.source, text: line.text },
              ],
              note: "These notes give different numbers or dates. Check the textbook or ask the teacher which is correct.",
            });
            if (!item.conflicted) item.text = `${item.text}  ⚠ differs between notes — see conflicts`;
            item.conflicted = true;
            // keep the other version in the note too, so no information is lost
            bucketFor(line.heading).items.push({
              text: `${line.text}  ⚠ differs between notes — see conflicts`,
              kind: line.kind,
              sources: [line.source],
              tokens: t,
              numbers: n,
              qty: q,
              conflicted: true,
            });
            handled = true;
          }
          if (handled) break;
        }
        if (handled) break;
      }

      if (!handled) {
        bucketFor(line.heading).items.push({ text: line.text, kind: line.kind, sources: [line.source], tokens: t, numbers: n, qty: q });
      }
    }
  }

  conflicts.push(...weekdayConflicts(req.notes));

  const sections: MergedSection[] = buckets
    .filter((b) => b.items.length)
    .map((b) => ({ heading: b.heading, items: b.items.map(({ text, kind, sources }) => ({ text, kind, sources })) }));

  const NOT_TERMS = /^(equation|formula|example|ex|note|notes|tip|answer|q|a|total|net)$/i;
  const termMap = new Map<string, MergeResult["keyTerms"][number]>();
  for (const i of sections.flatMap((s) => s.items).filter((i) => i.kind === "definition")) {
    const text = i.text.replace(/\s+⚠ differs between notes — see conflicts$/, "");
    const m =
      text.match(/^([^:=—–]{2,40})\s*(?::|=|—|–)\s*(.+)$/) || text.match(/^(.{2,40}?)\s+(?:is defined as|means|refers to)\s+(.+)$/i);
    if (!m || NOT_TERMS.test(m[1].trim())) continue;
    const term = m[1].trim();
    const prev = termMap.get(term.toLowerCase());
    if (prev) {
      prev.definition += `; ${m[2].trim()}`;
      prev.sources = Array.from(new Set([...prev.sources, ...i.sources]));
    } else termMap.set(term.toLowerCase(), { term, definition: m[2].trim(), sources: [...i.sources] });
  }
  const keyTerms = [...termMap.values()];

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const authors = Array.from(new Set(req.notes.map((n) => n.authorName)));

  return {
    title: req.topic ? `${req.topic} — combined notes` : "Combined class notes",
    overview: `Combined from ${req.notes.length} note${req.notes.length === 1 ? "" : "s"} by ${authors.join(", ")}. ${totalItems} unique point${totalItems === 1 ? "" : "s"} kept, ${duplicates} repeated line${duplicates === 1 ? "" : "s"} folded together, ${conflicts.length} disagreement${conflicts.length === 1 ? "" : "s"} flagged.`,
    sections,
    conflicts,
    keyTerms,
    sourceNoteIds: req.notes.map((n) => n.id),
    engine: "demo",
  };
}
