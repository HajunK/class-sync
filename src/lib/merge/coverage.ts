/**
 * Coverage check for AI merges.
 *
 * The spec requires that details appearing in only one student's note are kept.
 * Models sometimes fold different statements together, so after merging we
 * look for statements from each note that don't appear anywhere in the result
 * and add them back under "Also noted", citing their source.
 */
import type { MergedItem } from "../types";
import type { MergeRequest, MergeResult } from "./shared";

const STOPWORDS = new Set(
  (
    "a an the of and or to in on at for is are was were be been being by with as it its this that these those from into than then so if " +
    "not no do does did i you he she we they me my our your his her their them us also just very really such oh"
  ).split(" "),
);

/** The student marked this as assessment-relevant. */
const TEST_HINT = /(on the (test|quiz|exam)|will be on|★|\bmemorize\b|시험|퀴즈)/i;

/** Lower-cased content words. Korean words are cut to their first two syllables so particles (은/는/이/가…) don't matter. */
function words(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
      .map((w) => (/[가-힣]/.test(w) ? w.slice(0, 2) : w)),
  );
}

/** Split a note into individual statements (lines, then sentences). Headings are skipped. */
function statements(content: string) {
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    // Skip headings and labels like "Mr. Han explained:" — they introduce content rather than state it.
    .filter((l) => l && !l.startsWith("#") && !/:\s*$/.test(l))
    .map((l) => l.replace(/^(>\s*)?([-*•]|\d+[.)])\s+/, ""))
    // Split into sentences, but not after titles/abbreviations (Mr. Han, e.g. …).
    .flatMap((l) => l.split(/(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|etc|e\.g|i\.e)\.)(?<=[.!?。])\s+/))
    .map((l) => l.trim())
    .filter((l) => l.length > 2);
}

export function ensureCoverage(req: MergeRequest, result: MergeResult): MergeResult {
  const candidates = [
    ...result.sections.flatMap((s) => s.items.map((i) => i.text)),
    ...result.keyTerms.map((k) => `${k.term} ${k.definition}`),
    ...result.conflicts.flatMap((c) => c.versions.map((v) => v.text)),
  ].map(words);

  const missing: MergedItem[] = [];
  for (const note of req.notes) {
    for (const text of statements(note.content)) {
      const w = words(text);
      if (!w.size) continue;
      const covered = candidates.some((c) => {
        let hit = 0;
        for (const x of w) if (c.has(x)) hit++;
        return hit / w.size >= 0.6;
      });
      if (covered) continue;
      // Same statement missing from several notes → one item with all sources.
      const dup = missing.find((m) => m.text.toLowerCase() === text.toLowerCase());
      if (dup) {
        if (!dup.sources.includes(note.id)) dup.sources.push(note.id);
      } else missing.push({ text, kind: TEST_HINT.test(text) ? "test" : "point", sources: [note.id] });
    }
  }

  if (!missing.length) return result;
  return { ...result, sections: [...result.sections, { heading: "Also noted", items: missing }] };
}
