import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { currentClass, formatLeft, minutesLeft, validateSchedule } from "./schedule";
import type { ClassRoom, ClassSchedule } from "./types";

// A Tuesday-or-whatever day; the tests read the weekday from the date itself.
const at = (h: number, m: number, s = 0) => new Date(2026, 9, 13, h, m, s);
const sched = (start: string, end: string, days = [at(0, 0).getDay()]): ClassSchedule => ({ days, start, end });
const cls = (course: string, schedule?: ClassSchedule) => ({ id: course, course, schedule }) as ClassRoom;

describe("validateSchedule", () => {
  it("accepts a valid schedule", () => assert.equal(validateSchedule(sched("13:10", "14:00")), null));
  it("needs a day", () => assert.equal(validateSchedule(sched("13:10", "14:00", []))?.days, "Pick at least one day."));
  it("needs both times", () => assert.ok(validateSchedule(sched("", "14:00"))?.time));
  it("rejects an end that isn't after the start", () => {
    assert.ok(validateSchedule(sched("14:00", "14:00"))?.time);
    assert.ok(validateSchedule(sched("14:00", "13:10"))?.time);
  });
});

describe("minutesLeft", () => {
  const s = sched("13:10", "14:00");
  it("counts down to the end", () => assert.equal(minutesLeft(s, at(13, 37)), 23));
  it("rounds a partial minute up", () => assert.equal(minutesLeft(s, at(13, 37, 30)), 23));
  it("is the full length at the start", () => assert.equal(minutesLeft(s, at(13, 10)), 50));
  it("shows 1 in the last minute", () => assert.equal(minutesLeft(s, at(13, 59, 30)), 1));
  it("is null at the end time and after", () => {
    assert.equal(minutesLeft(s, at(14, 0)), null);
    assert.equal(minutesLeft(s, at(15, 0)), null);
  });
  it("is null before the start", () => assert.equal(minutesLeft(s, at(13, 9, 59)), null));
  it("is null on a day the class doesn't meet", () => assert.equal(minutesLeft(sched("13:10", "14:00", [(at(0, 0).getDay() + 1) % 7]), at(13, 37)), null));
  it("is null without a schedule", () => assert.equal(minutesLeft(undefined, at(13, 37)), null));
});

describe("currentClass", () => {
  it("picks the class that ends soonest", () => {
    const got = currentClass([cls("A", sched("13:00", "15:00")), cls("B", sched("13:00", "14:00")), cls("C")], at(13, 30));
    assert.deepEqual([got?.cls.course, got?.left], ["B", 30]);
  });
  it("is null when nothing is in session", () => assert.equal(currentClass([cls("A", sched("13:00", "14:00"))], at(9, 0)), null));
});

describe("formatLeft", () => {
  it("uses minutes under an hour", () => assert.equal(formatLeft(23), "23 min left"));
  it("uses hours and minutes from an hour", () => {
    assert.equal(formatLeft(65), "1h 5m left");
    assert.equal(formatLeft(60), "1h 0m left");
  });
});
