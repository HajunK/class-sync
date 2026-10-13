import type { MergedConflict, MergedItemKind, MergedNote, MergedSection } from "../types";

export interface MergeInputNote {
  id: string;
  authorName: string;
  content: string;
}

export interface MergeRequest {
  course: string;
  topic: string;
  date: string;
  notes: MergeInputNote[];
}

export type MergeResult = Omit<MergedNote, "mergedAt" | "mergedByName">;

const KINDS: MergedItemKind[] = ["point", "example", "definition", "test"];

/**
 * Make sure whatever came back from the model matches our schema, and that
 * every source reference points at a real note.
 */
export function normalizeResult(raw: unknown, notes: MergeInputNote[], aliases: Record<string, string>): Omit<MergeResult, "engine" | "model"> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const valid = new Set(notes.map((n) => n.id));
  const mapSources = (v: unknown): string[] => {
    const arr = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
    const out = arr
      .map((s) => String(s).trim())
      .map((s) => aliases[s] || aliases[s.toUpperCase()] || s)
      .filter((s) => valid.has(s));
    return Array.from(new Set(out));
  };
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const sections: MergedSection[] = (Array.isArray(r.sections) ? r.sections : [])
    .map((s: Record<string, unknown>) => ({
      heading: str(s?.heading) || "Notes",
      items: (Array.isArray(s?.items) ? s.items : [])
        .map((i: Record<string, unknown>) => ({
          text: str(i?.text),
          kind: (KINDS.includes(i?.kind as MergedItemKind) ? i.kind : "point") as MergedItemKind,
          sources: mapSources(i?.sources),
        }))
        .filter((i: { text: string }) => i.text),
    }))
    .filter((s: MergedSection) => s.items.length);

  const conflicts: MergedConflict[] = (Array.isArray(r.conflicts) ? r.conflicts : [])
    .map((c: Record<string, unknown>) => ({
      topic: str(c?.topic) || "Disagreement",
      note: str(c?.note),
      versions: (Array.isArray(c?.versions) ? c.versions : [])
        .map((v: Record<string, unknown>) => ({ source: mapSources(v?.source)[0] || "", text: str(v?.text) }))
        .filter((v: { source: string; text: string }) => v.source && v.text),
    }))
    .filter((c: MergedConflict) => c.versions.length >= 2);

  const keyTerms = (Array.isArray(r.keyTerms) ? r.keyTerms : [])
    .map((k: Record<string, unknown>) => ({
      term: str(k?.term),
      definition: str(k?.definition),
      sources: mapSources(k?.sources),
    }))
    .filter((k: { term: string }) => k.term);

  return {
    title: str(r.title) || "Merged class notes",
    overview: str(r.overview),
    sections,
    conflicts,
    keyTerms,
    sourceNoteIds: notes.map((n) => n.id),
  };
}
