import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { instructionFor, parseSuggestion } from "./rewrite";
import { countWords, isRewriteMode, MIN_WORDS_FOR_STYLE } from "./rewrite-shared";

describe("parseSuggestion", () => {
  it("reads the suggestion from JSON", () => assert.equal(parseSuggestion('{"suggestion": " It is fine. "}'), "It is fine."));
  it("strips a code fence around a plain reply", () => assert.equal(parseSuggestion("```\nHello there\n```"), "Hello there"));
  it("falls back to the plain reply when it isn't JSON", () => assert.equal(parseSuggestion("  Just text  "), "Just text"));
  it("is empty for an empty reply", () => assert.equal(parseSuggestion(""), ""));
});

describe("instructionFor", () => {
  it("asks for each kind of rewrite", () => {
    assert.match(instructionFor("grammar"), /no grammar mistakes/);
    assert.match(instructionFor("formal"), /more formal, academic tone/);
    assert.match(instructionFor("concise"), /more concise/);
  });
  it("keeps the shared rules in every mode", () => {
    for (const mode of ["grammar", "formal", "concise"] as const) assert.match(instructionFor(mode), /Never translate/);
  });
});

describe("rewrite helpers", () => {
  it("counts words", () => {
    assert.equal(countWords(""), 0);
    assert.equal(countWords("  one   two\nthree "), 3);
  });
  it("offers style options only above the word limit", () => {
    assert.equal(MIN_WORDS_FOR_STYLE, 10);
    assert.ok(countWords("one two three four five six seven eight nine ten eleven") > MIN_WORDS_FOR_STYLE);
    assert.ok(!(countWords("one two three four five six seven eight nine ten") > MIN_WORDS_FOR_STYLE));
  });
  it("recognizes valid modes", () => {
    assert.ok(isRewriteMode("formal"));
    assert.ok(!isRewriteMode("shout"));
  });
});
