import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MergedNote } from "../types";
import { contributionShares, estimateContributions, roundPercents } from "./contributions";
import { normalizeResult } from "./shared";

const note = (over: Partial<MergedNote> = {}): MergedNote => ({
  title: "t",
  overview: "",
  sections: [],
  conflicts: [],
  keyTerms: [],
  sourceNoteIds: ["a", "b"],
  engine: "openai",
  ...over,
});
const item = (text: string, sources: string[]) => ({ text, kind: "point" as const, sources });

describe("roundPercents", () => {
  it("adds up to exactly 100", () => {
    const out = roundPercents([33.3, 33.3, 33.4]);
    assert.equal(out.reduce((a, b) => a + b, 0), 100);
    assert.deepEqual(roundPercents([50, 50]), [50, 50]);
  });
  it("rescales amounts that don't add up to 100", () => assert.deepEqual(roundPercents([1, 3]), [25, 75]));
  it("handles no amounts", () => assert.deepEqual(roundPercents([0, 0]), [0, 0]));
});

describe("estimateContributions", () => {
  it("weights points by length and splits shared points equally", () => {
    const m = note({ sections: [{ heading: "h", items: [item("one two three four", ["a"]), item("five six", ["a", "b"]), item("seven eight", ["b"])] }] });
    // a: 4 + 1 = 5 words, b: 1 + 2 = 3 words
    assert.deepEqual(estimateContributions(m), { a: 62.5, b: 37.5 });
  });
});

describe("contributionShares", () => {
  it("uses the AI's own breakdown when there is one", () => {
    const m = note({ contributions: { a: 70, b: 30 }, sections: [{ heading: "h", items: [item("x y", ["b"])] }] });
    assert.deepEqual(contributionShares(m), [{ id: "a", percent: 70 }, { id: "b", percent: 30 }]);
  });
  it("falls back to the cited sources", () => {
    const m = note({ sections: [{ heading: "h", items: [item("a b c", ["a"]), item("d", ["b"])] }] });
    assert.deepEqual(contributionShares(m), [{ id: "a", percent: 75 }, { id: "b", percent: 25 }]);
  });
  it("leaves out students who contributed nothing", () => {
    assert.deepEqual(contributionShares(note({ contributions: { a: 100, b: 0 } })), [{ id: "a", percent: 100 }]);
  });
});

describe("normalizeResult contributions", () => {
  const notes = [
    { id: "uidA", authorName: "A", content: "" },
    { id: "uidB", authorName: "B", content: "" },
  ];
  const aliases = { N1: "uidA", N2: "uidB" };
  it("maps labels to note ids and rescales to 100", () => {
    const r = normalizeResult({ contributions: [{ source: "N1", percent: 30 }, { source: "N2", percent: "10%" }] }, notes, aliases);
    assert.deepEqual(r.contributions, { uidA: 75, uidB: 25 });
  });
  it("gives a student the model skipped 0", () => {
    const r = normalizeResult({ contributions: [{ source: "N1", percent: 100 }] }, notes, aliases);
    assert.deepEqual(r.contributions, { uidA: 100, uidB: 0 });
  });
  it("leaves the key out when there's nothing usable", () => {
    for (const raw of [{}, { contributions: [] }, { contributions: [{ source: "N9", percent: 50 }, { source: "N1", percent: -5 }] }]) {
      assert.equal("contributions" in normalizeResult(raw, notes, aliases), false);
    }
  });
});
