import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extensionFor, formatDuration, pickRecordingType, spokenText } from "./dictation";

describe("pickRecordingType", () => {
  it("prefers webm with opus", () => assert.equal(pickRecordingType(() => true), "audio/webm;codecs=opus"));
  it("falls back to mp4 for Safari", () => assert.equal(pickRecordingType((t) => t === "audio/mp4"), "audio/mp4"));
  it("returns empty when nothing is supported", () => assert.equal(pickRecordingType(() => false), ""));
});

describe("extensionFor", () => {
  it("maps formats to extensions", () => {
    assert.equal(extensionFor("audio/webm;codecs=opus"), "webm");
    assert.equal(extensionFor("audio/mp4"), "mp4");
    assert.equal(extensionFor("audio/ogg;codecs=opus"), "ogg");
    assert.equal(extensionFor("audio/wav"), "wav");
    assert.equal(extensionFor("audio/mpeg"), "mp3");
  });
  it("defaults to webm", () => assert.equal(extensionFor(""), "webm"));
});

describe("formatDuration", () => {
  it("shows minutes and seconds", () => {
    assert.equal(formatDuration(0), "0:00");
    assert.equal(formatDuration(9), "0:09");
    assert.equal(formatDuration(75), "1:15");
    assert.equal(formatDuration(300), "5:00");
  });
});

describe("spokenText", () => {
  it("adds a space when the cursor follows a word", () => assert.equal(spokenText("d", "hello there"), " hello there"));
  it("doesn't add one at the start of a line or after a space", () => {
    assert.equal(spokenText("", "hello"), "hello");
    assert.equal(spokenText(" ", "hello"), "hello");
  });
  it("trims, and is empty for no words", () => {
    assert.equal(spokenText("", "  hi  "), "hi");
    assert.equal(spokenText("x", "   "), "");
  });
});
