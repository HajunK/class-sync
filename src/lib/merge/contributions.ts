import type { MergedNote } from "../types";

export interface Share {
  /** note id (= author uid) */
  id: string;
  /** whole percent; the shares of one note add up to 100 */
  percent: number;
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Scales amounts so they add up to 100. */
function toPercents(amounts: Record<string, number>): Record<string, number> {
  const total = Object.values(amounts).reduce((a, b) => a + b, 0);
  return total > 0 ? Object.fromEntries(Object.entries(amounts).map(([id, v]) => [id, (v / total) * 100])) : {};
}

/**
 * Shares worked out from which notes each point was cited from: a point is worth its word count,
 * split equally between the students it's cited to. Used when the AI didn't give its own breakdown
 * (older notes, the offline merge, sample data).
 */
export function estimateContributions(merged: Pick<MergedNote, "sections" | "keyTerms">): Record<string, number> {
  const credit: Record<string, number> = {};
  const give = (text: string, sources: string[]) => {
    if (!sources.length) return;
    const each = Math.max(1, wordCount(text)) / sources.length;
    for (const id of sources) credit[id] = (credit[id] || 0) + each;
  };
  merged.sections.forEach((s) => s.items.forEach((i) => give(i.text, i.sources)));
  merged.keyTerms.forEach((k) => give(`${k.term} ${k.definition}`, k.sources));
  return toPercents(credit);
}

/** Whole-number percents (largest remainder), so a chart's labels add up to exactly 100. */
export function roundPercents(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const scaled = values.map((v) => (v / total) * 100);
  const floors = scaled.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  scaled
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (left-- > 0) floors[i]++;
    });
  return floors;
}

/** Each student's share of the class note, biggest first: the AI's own breakdown if it gave one, else an estimate from the cited sources. */
export function contributionShares(merged: MergedNote): Share[] {
  const own = merged.contributions && Object.values(merged.contributions).some((v) => v > 0) ? merged.contributions : null;
  const amounts = own ?? estimateContributions(merged);
  const entries = Object.entries(amounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const percents = roundPercents(entries.map(([, v]) => v));
  return entries.map(([id], i) => ({ id, percent: percents[i] })).filter((s) => s.percent > 0);
}
