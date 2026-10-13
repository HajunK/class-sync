/**
 * Test cases from kisj-grade-calculator/docs/CALCULATOR_SPEC.md §9.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGpaRows, commitScore, computeDomain, computeGpa, letterGrade, pasteFromDomain, sanitizeTyping, truncate2, type GpaRow } from "./grades";

describe("§9.1 commitScore", () => {
  const cases: [string, string][] = [
    ["45/50", "90"],
    ["1/3", "33"],
    ["2/3", "67"],
    ["17.5/20", "88"],
    ["0/5", "0"],
    ["150/100", "100"],
    ["5/0", ""],
    ["/5", ""],
    ["5/", ""],
    ["90.", "90"],
  ];
  for (const [input, expected] of cases) it(`${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => assert.equal(commitScore(input), expected));
});

describe("§9.2 sanitizeTyping", () => {
  const cases: [string, string | null][] = [
    ["9a5", "95"],
    ["85.55", "85.5"],
    ["8.5.5", "8.5"],
    ["101", null],
    ["100.5", null],
    ["05", null],
    ["0.5", "0.5"],
    ["45/50/2", "45/502"],
  ];
  for (const [input, expected] of cases) it(`${JSON.stringify(input)} → ${expected === null ? "rejected" : JSON.stringify(expected)}`, () => assert.equal(sanitizeTyping(input), expected));
  it('"45/502" commits to 9', () => assert.equal(commitScore("45/502"), "9"));
});

describe("§9.3 letterGrade", () => {
  const cases: [number, string][] = [
    [100, "A+"], [98, "A+"],
    [97.9, "A"], [93, "A"],
    [92.9, "A-"], [90, "A-"],
    [89.5, "B+"],
    [60, "D-"],
    [59.9, "F"], [0, "F"],
  ];
  for (const [score, label] of cases) it(`${score} → ${label}`, () => assert.equal(letterGrade(score).label, label));
});

describe("§9.4 computeDomain", () => {
  const n = (xs: (number | null)[]) => xs;
  const fmt = (v: number | null) => (v == null ? "-" : truncate2(v));
  const cases: {
    id: number;
    hasFinal: boolean;
    F: (number | null)[];
    S: (number | null)[];
    E?: (number | null)[];
    unlinked?: number[];
    fa: string; sa: string; d: string; big: string; grade: string | null; state: string;
  }[] = [
    { id: 1, hasFinal: false, F: n([80, 90]), S: n([70, 95]), fa: "87.50", sa: "82.50", d: "83.75", big: "84", grade: "B", state: "values" },
    { id: 2, hasFinal: false, F: n([80, 90]), S: n([70, 95]), unlinked: [1], fa: "85.00", sa: "82.50", d: "83.12", big: "83", grade: "B", state: "values" },
    { id: 3, hasFinal: false, F: n([92, 93]), S: [], fa: "92.50", sa: "-", d: "92.50", big: "93", grade: "A", state: "single" },
    { id: 4, hasFinal: false, F: [], S: n([88, 91]), fa: "-", sa: "89.50", d: "89.50", big: "90", grade: "A-", state: "single" },
    { id: 5, hasFinal: false, F: n([85]), S: n([85]), fa: "85.00", sa: "85.00", d: "85.00", big: "85", grade: "B", state: "values" },
    { id: 6, hasFinal: false, F: n([70, null, 95]), S: n([90, 80]), fa: "92.50", sa: "85.00", d: "86.87", big: "87", grade: "B+", state: "values" },
    { id: 7, hasFinal: false, F: n([100, 100, 99]), S: [], fa: "99.66", sa: "-", d: "99.66", big: "100", grade: "A+", state: "single" },
    { id: 8, hasFinal: true, F: n([90]), S: n([80]), E: n([70]), fa: "90.00", sa: "80.00", d: "80.00", big: "80", grade: "B-", state: "values" },
    { id: 9, hasFinal: true, F: n([90]), S: n([80]), fa: "90.00", sa: "80.00", d: "82.50", big: "83", grade: "B", state: "values" },
    { id: 10, hasFinal: true, F: [], S: [], E: n([70]), fa: "-", sa: "-", d: "70.00", big: "70", grade: "C-", state: "values" },
    { id: 11, hasFinal: false, F: [], S: [], fa: "-", sa: "-", d: "-", big: "--", grade: null, state: "empty" },
  ];
  for (const c of cases) {
    it(`case ${c.id}`, () => {
      const r = computeDomain({ formative: c.F, summative: c.S, final: c.E ?? [], unlinkedRows: c.unlinked ?? [] }, c.hasFinal);
      assert.deepEqual(
        { fa: fmt(r.fa), sa: fmt(r.sa), d: fmt(r.domain), big: r.rounded == null ? "--" : String(r.rounded), grade: r.grade?.label ?? null, state: r.breakdown },
        { fa: c.fa, sa: c.sa, d: c.d, big: c.big, grade: c.grade, state: c.state },
      );
    });
  }
  it("case 1: row 1 is replaced, row 0 is not", () => {
    const r = computeDomain({ formative: [80, 90], summative: [70, 95], final: [], unlinkedRows: [] }, false);
    assert.deepEqual(r.replacedRows, [1]);
    assert.deepEqual(r.qualifyingRows, [1]);
  });
  it("case 2: unlinked row still qualifies (keeps its link button) but is not replaced", () => {
    const r = computeDomain({ formative: [80, 90], summative: [70, 95], final: [], unlinkedRows: [1] }, false);
    assert.deepEqual(r.replacedRows, []);
    assert.deepEqual(r.qualifyingRows, [1]);
  });
});

describe("§9.5 computeGpa", () => {
  const rows = (...r: [string, GpaRow["slug"]][]) => r.map(([name, slug]) => ({ name, slug }));
  const cases: { id: number; rows: GpaRow[]; unweighted: string; weighted: string; hasAp: boolean }[] = [
    { id: 1, rows: rows(["Algebra II", "a"], ["AP Biology", "b-plus"]), unweighted: "3.6665", weighted: "4.1665", hasAp: true },
    { id: 2, rows: rows(["Korean Language", "a-minus"], ["Korean SS", "b"], ["Biology", "a"]), unweighted: "3.6667", weighted: "3.6667", hasAp: false },
    { id: 3, rows: rows(["Biology", "a"], ["Lunch", "f"], ["Chemistry", "b"]), unweighted: "3.5000", weighted: "3.5000", hasAp: false },
    { id: 4, rows: rows(["AP Biology", "a-plus"], ["AP Chemistry", null]), unweighted: "4.0000", weighted: "5.0000", hasAp: true },
    { id: 5, rows: rows(["Biology", null]), unweighted: "-", weighted: "-", hasAp: false },
    { id: 6, rows: rows(["Biology", "b"], ["AP Lunch", null]), unweighted: "3.0000", weighted: "3.0000", hasAp: true },
    { id: 7, rows: rows(["Foo", "a"], ["Biology", "c"]), unweighted: "3.0000", weighted: "3.0000", hasAp: false },
  ];
  for (const c of cases) it(`case ${c.id}`, () => assert.deepEqual(computeGpa(c.rows), { unweighted: c.unweighted, weighted: c.weighted, hasAp: c.hasAp }));
});

describe("pasteFromDomain (§11 #5: only overwrite courses that have a Domain grade)", () => {
  it("keeps manual grades for courses without a Domain grade", () => {
    const out = pasteFromDomain(
      [{ name: "Biology", slug: "c" }, { name: "Art", slug: "a" }],
      { Biology: "b-plus", Art: null },
    );
    assert.deepEqual(out, [{ name: "Biology", slug: "b-plus" }, { name: "Art", slug: "a" }]);
  });
});

describe("buildGpaRows (§5.1)", () => {
  it("expands combos and prefers GPA-tab grades, then Domain grades", () => {
    const rows = buildGpaRows(["Korean", "Biology", "AP Biology"], [{ name: "Biology", slug: "a" }], { "Korean SS": "b", Biology: "c", "AP Biology": "b-plus" });
    assert.deepEqual(rows, [
      { name: "Korean Language", slug: null },
      { name: "Korean SS", slug: "b" },
      { name: "Biology", slug: "a" },
      { name: "AP Biology", slug: "b-plus" },
    ]);
  });
  it("a grade cleared on the GPA tab stays cleared", () => {
    assert.deepEqual(buildGpaRows(["Biology"], [{ name: "Biology", slug: null }], { Biology: "a" }), [{ name: "Biology", slug: null }]);
  });
});
