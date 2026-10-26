import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { averageConfidence, linesToText, shouldInvert, type OcrLine } from "./ocr-text";

const line = (...words: [string, number][]): OcrLine => ({ words: words.map(([text, confidence]) => ({ text, confidence })) });

describe("linesToText", () => {
  it("joins words into lines", () => {
    assert.equal(linesToText([line(["Carbon", 90], ["cycle", 88]), line(["- Plants", 95], ["need", 91], ["CO2", 80])]), "Carbon cycle\n- Plants need CO2");
  });
  it("marks words below the threshold as illegible", () => {
    assert.equal(linesToText([line(["The", 90], ["mitochondria", 40], ["is", 85])]), "The [illegible] is");
  });
  it("collapses runs of illegible words", () => {
    assert.equal(linesToText([line(["a", 90], ["x", 10], ["y", 20], ["z", 30], ["b", 90])]), "a [illegible] b");
  });
  it("drops a line of just one or two unreadable words", () => {
    assert.equal(linesToText([line(["ok", 90]), line(["~", 10], ["|", 5]), line(["fine", 90])]), "ok\nfine");
  });
  it("keeps a long fully unreadable line, since something was written there", () => {
    assert.equal(linesToText([line(["a", 1], ["b", 1], ["c", 1])]), "[illegible]");
  });
  it("skips empty words", () => assert.equal(linesToText([line(["hi", 90], [" ", 90], ["there", 90])]), "hi there"));
  it("respects a custom threshold", () => {
    assert.equal(linesToText([line(["hi", 70], ["there", 90]), line(["ok", 70])], 50), "hi there\nok");
    assert.equal(linesToText([line(["hi", 70], ["there", 90])], 80), "[illegible] there");
  });
  it("is empty for no lines", () => assert.equal(linesToText([]), ""));
});

describe("helpers", () => {
  it("averages confidence", () => {
    assert.equal(averageConfidence([{ text: "a", confidence: 80 }, { text: "b", confidence: 60 }]), 70);
    assert.equal(averageConfidence([]), 0);
  });
  it("inverts only mostly dark photos", () => {
    assert.equal(shouldInvert(40), true);
    assert.equal(shouldInvert(220), false);
  });
});
