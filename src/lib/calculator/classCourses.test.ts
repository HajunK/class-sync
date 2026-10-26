import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogMatches, classesToImport } from "./classCourses";

describe("catalogMatches", () => {
  it("matches class names to catalog courses, ignoring case and spaces", () => {
    assert.deepEqual(catalogMatches(["ap biology", "  Algebra II "]), ["AP Biology", "Algebra II"]);
  });
  it("skips classes that aren't in the catalog and removes repeats", () => {
    assert.deepEqual(catalogMatches(["Book Club", "AP Biology", "AP Biology"]), ["AP Biology"]);
  });
});

describe("classesToImport", () => {
  it("returns matching classes that aren't in the calculator yet", () => {
    assert.deepEqual(classesToImport(["AP Biology", "Algebra II"], ["Algebra II"], []), ["AP Biology"]);
  });
  it("doesn't bring back a course that was added before and then removed", () => {
    assert.deepEqual(classesToImport(["AP Biology", "Algebra II"], ["Algebra II"], ["AP Biology", "Algebra II"]), []);
  });
  it("is empty when there's nothing to add", () => assert.deepEqual(classesToImport([], ["Algebra II"], []), []));
});
