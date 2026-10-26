import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diffWords } from "./diff";

describe("diffWords", () => {
  it("returns one unchanged part for identical text", () => {
    assert.deepEqual(diffWords("the cat sat", "the cat sat"), [{ text: "the cat sat", kind: "same" }]);
  });
  it("marks a replaced word as removed then added", () => {
    assert.deepEqual(diffWords("this are fine", "this is fine"), [
      { text: "this", kind: "same" },
      { text: "are", kind: "del" },
      { text: "is", kind: "add" },
      { text: "fine", kind: "same" },
    ]);
  });
  it("marks inserted words", () => {
    assert.deepEqual(diffWords("went store", "went to the store"), [
      { text: "went", kind: "same" },
      { text: "to the", kind: "add" },
      { text: "store", kind: "same" },
    ]);
  });
  it("marks removed words", () => {
    assert.deepEqual(diffWords("it is is fine", "it is fine"), [
      { text: "it is", kind: "same" },
      { text: "is", kind: "del" },
      { text: "fine", kind: "same" },
    ]);
  });
  it("ignores extra spaces and handles empty text", () => {
    assert.deepEqual(diffWords("a  b", "a b"), [{ text: "a b", kind: "same" }]);
    assert.deepEqual(diffWords("", "new"), [{ text: "new", kind: "add" }]);
  });
});
