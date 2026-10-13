import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export const toKey = (d: Date) => format(d, "yyyy-MM-dd");
export const todayKey = () => toKey(new Date());
export const fromKey = (key: string) => parseISO(key);

export function tsToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  try {
    return ts.toDate();
  } catch {
    return null;
  }
}

export function relativeDay(key: string) {
  const diff = differenceInCalendarDays(fromKey(key), new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff >= 7 && diff < 21) return `In ${Math.round(diff / 7)} week${Math.round(diff / 7) === 1 ? "" : "s"}`;
  if (diff < 0 && diff > -60) return `${-diff} days ago`;
  return format(fromKey(key), "MMM d");
}

export function daysUntil(key: string) {
  return differenceInCalendarDays(fromKey(key), new Date());
}

export function formatTime(time?: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return format(d, "h:mm a");
}

export function timeAgo(date: Date | null) {
  if (!date) return "just now";
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return format(date, "MMM d");
}
