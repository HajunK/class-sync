import type { Timestamp } from "firebase/firestore";

export type EventType = "quiz" | "exam" | "assignment" | "deadline" | "other";

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "assignment", label: "Assignment" },
  { value: "deadline", label: "Deadline" },
  { value: "other", label: "Other" },
];

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  school?: string;
  /** The color theme this student picked (green, blue or purple). */
  theme?: string;
  /** Announcements this student cleared from the bottom of the screen (they stay on the Announcements tab). */
  dismissedAnnouncementIds?: string[];
}

/** A class workspace: one school + course + section. Students join with `code`. */
/** When a class meets: weekdays (0 = Sunday … 6 = Saturday) and a "HH:mm" 24-hour time range, in the student's local time. */
export interface ClassSchedule {
  days: number[];
  start: string;
  end: string;
}

export interface ClassRoom {
  id: string;
  school: string;
  course: string;
  section: string;
  code: string;
  color: string;
  /** Missing on classes created before schedules existed. */
  schedule?: ClassSchedule;
  memberIds: string[];
  createdBy: string;
  createdAt?: Timestamp;
}

export interface Member {
  uid: string;
  displayName: string;
  /** When the student last marked the class calendar as seen. */
  lastSeenAt?: Timestamp | null;
  /** The color this student picked for the class. Only they see it; absent means the class's own color. */
  color?: string;
  /** Calendar entries this student has checked off in their Upcoming list. */
  doneEventIds?: string[];
}

export interface ClassEvent {
  id: string;
  classId: string;
  type: EventType;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm, optional */
  time?: string;
  details?: string;
  createdBy: string;
  createdByName: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  updatedBy?: string;
  /** uids of classmates who confirmed the current version */
  confirmations: string[];
}

export interface EventHistory {
  id: string;
  action: "created" | "edited" | "confirmed" | "unconfirmed";
  by: string;
  byName: string;
  at?: Timestamp;
  changes?: Record<string, { from: string; to: string }>;
}

/** One class session (lesson). Each student writes their own note in it. */
export interface Session {
  id: string;
  classId: string;
  /** YYYY-MM-DD */
  date: string;
  topic: string;
  createdBy: string;
  createdByName: string;
  createdAt?: Timestamp;
  /** uids of students who wrote a note */
  contributors: string[];
  merged?: MergedNote | null;
}

/** A student's own note for a session. Document id = the student's uid. */
export interface Note {
  id: string;
  authorId: string;
  authorName: string;
  /** Rich text from the editor */
  html: string;
  /** Plain-text version (used for AI merging) */
  text: string;
  updatedAt?: Timestamp;
}

/* ── AI-merged class note ───────────────────────────────────── */

export type MergedItemKind = "point" | "example" | "definition" | "test";

export interface MergedItem {
  text: string;
  kind: MergedItemKind;
  /** note ids (= author uids) this item came from */
  sources: string[];
}

export interface MergedSection {
  heading: string;
  items: MergedItem[];
}

export interface MergedConflict {
  topic: string;
  versions: { source: string; text: string }[];
  note: string;
}

export interface MergedNote {
  title: string;
  overview: string;
  sections: MergedSection[];
  conflicts: MergedConflict[];
  keyTerms: { term: string; definition: string; sources: string[] }[];
  sourceNoteIds: string[];
  /** Each student's share (percent, adds up to about 100) of the information in this note, as judged by the AI. Keyed by note id (= author uid). */
  contributions?: Record<string, number>;
  /** openai = GPT, demo = offline fallback, sample = hand-written seed data */
  engine: "openai" | "demo" | "sample";
  model?: string;
  mergedAt?: Timestamp;
  mergedByName?: string;
}

/** A message any signed-in user can post; everyone sees it at the bottom of every tab. */
export interface Announcement {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp | null;
}
