import { formatTime } from "./dates";
import type { ClassRoom, ClassSchedule } from "./types";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export interface ScheduleErrors {
  days?: string;
  time?: string;
}

/** What's wrong with a schedule being entered, or null when it's good to save. */
export function validateSchedule(s: ClassSchedule): ScheduleErrors | null {
  const errors: ScheduleErrors = {};
  if (s.days.length === 0) errors.days = "Pick at least one day.";
  if (!TIME.test(s.start) || !TIME.test(s.end)) errors.time = "Set when the class starts and ends.";
  else if (toMinutes(s.end) <= toMinutes(s.start)) errors.time = "End time must be after the start time.";
  return errors.days || errors.time ? errors : null;
}

/** Whole minutes until the class ends if it's in session at `now`, otherwise null. */
export function minutesLeft(s: ClassSchedule | undefined, now: Date): number | null {
  if (!s || validateSchedule(s) || !s.days.includes(now.getDay())) return null;
  const at = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  if (at < toMinutes(s.start) || at >= toMinutes(s.end)) return null;
  return Math.ceil(toMinutes(s.end) - at);
}

/** The class in session that ends soonest (when several overlap), with its minutes left. */
export function currentClass(classes: ClassRoom[], now: Date): { cls: ClassRoom; left: number } | null {
  let best: { cls: ClassRoom; left: number } | null = null;
  for (const cls of classes) {
    const left = minutesLeft(cls.schedule, now);
    if (left != null && (!best || left < best.left)) best = { cls, left };
  }
  return best;
}

export function formatLeft(left: number) {
  return left >= 60 ? `${Math.floor(left / 60)}h ${left % 60}m left` : `${left} min left`;
}

/** "Mon, Wed, Fri · 1:10 PM–2:00 PM" */
export function formatSchedule(s: ClassSchedule) {
  return `${s.days.map((d) => WEEKDAYS[d]).join(", ")} · ${formatTime(s.start)}–${formatTime(s.end)}`;
}
