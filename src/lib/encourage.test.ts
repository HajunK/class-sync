import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanCourses, MAX_COURSES, parseMessages } from "./encourage";

describe("cleanCourses", () => {
  it("trims, drops blanks and repeats", () => assert.deepEqual(cleanCourses([" Algebra II ", "", "Algebra II", "AP Biology", null, 7]), ["Algebra II", "AP Biology", "7"]));
  it("caps how many and how long", () => {
    assert.equal(cleanCourses(Array.from({ length: 50 }, (_, i) => `Course ${i}`)).length, MAX_COURSES);
    assert.equal(cleanCourses(["x".repeat(500)])[0].length, 80);
  });
  it("is empty for anything that isn't a list", () => assert.deepEqual(cleanCourses("Algebra"), []));
});

describe("parseMessages", () => {
  it("lines messages up with the courses by index", () => {
    assert.deepEqual(parseMessages('{"messages":[{"index":2,"message":"B msg"},{"index":1,"message":"A msg"}]}', 2), ["A msg", "B msg"]);
  });
  it("strips quotes and extra whitespace", () => assert.deepEqual(parseMessages('{"messages":[{"index":1,"message":"  “You  can do this!”  "}]}', 1), ["You can do this!"]));
  it("leaves empty strings for missing, bad or out-of-range entries", () => {
    assert.deepEqual(parseMessages('{"messages":[{"index":1,"message":"ok"},{"index":9,"message":"far"},{"index":2,"message":42}]}', 3), ["ok", "", ""]);
  });
  it("drops a message that's far too long", () => assert.deepEqual(parseMessages(JSON.stringify({ messages: [{ index: 1, message: "x".repeat(300) }] }), 1), [""]));
  it("copes with junk replies", () => {
    assert.deepEqual(parseMessages("not json", 2), ["", ""]);
    assert.deepEqual(parseMessages('{"messages":"nope"}', 1), [""]);
  });
});
