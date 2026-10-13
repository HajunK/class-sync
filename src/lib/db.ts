"use client";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import type { ClassEvent, ClassRoom, EventHistory, MergedNote, Member, Note, Session } from "./types";

export const CLASS_COLORS = ["#2357c6", "#0f8a6b", "#c2410c", "#7c3aed", "#be185d", "#b88a00"];

export interface Actor {
  uid: string;
  name: string;
}

/* ── Classes ──────────────────────────────────────────────────── */

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createClass(actor: Actor, input: { school: string; course: string; section: string }) {
  const code = randomCode();
  const classRef = doc(collection(db, "classes"));
  const batch = writeBatch(db);
  batch.set(classRef, {
    school: input.school.trim(),
    course: input.course.trim(),
    section: input.section.trim(),
    code,
    color: CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)],
    memberIds: [actor.uid],
    createdBy: actor.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "classCodes", code), { classId: classRef.id });
  batch.set(doc(db, "classes", classRef.id, "members", actor.uid), { displayName: actor.name, lastSeenAt: serverTimestamp() });
  await batch.commit();
  return classRef.id;
}

export async function joinClassByCode(actor: Actor, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const codeSnap = await getDoc(doc(db, "classCodes", code));
  if (!codeSnap.exists()) throw new Error("No class found with that code.");
  const classId = codeSnap.data().classId as string;
  const batch = writeBatch(db);
  batch.update(doc(db, "classes", classId), { memberIds: arrayUnion(actor.uid) });
  batch.set(doc(db, "classes", classId, "members", actor.uid), { displayName: actor.name, lastSeenAt: null }, { merge: true });
  await batch.commit();
  return classId;
}

export async function markClassSeen(uid: string, classId: string) {
  await updateDoc(doc(db, "classes", classId, "members", uid), { lastSeenAt: serverTimestamp() });
}

/* ── Calendar entries ─────────────────────────────────────────── */

export type EventInput = Pick<ClassEvent, "type" | "title" | "date" | "time" | "details">;

const FIELDS: (keyof EventInput)[] = ["type", "title", "date", "time", "details"];
/** Changing any of these means earlier confirmations no longer apply. */
const CORE_FIELDS: (keyof EventInput)[] = ["type", "title", "date", "time"];
export const VERIFY_THRESHOLD = 2;

function clean(input: EventInput) {
  return { type: input.type, title: input.title.trim(), date: input.date, time: input.time || "", details: input.details?.trim() || "" };
}

function historyRef(event: { classId: string; id: string }) {
  return doc(collection(db, "classes", event.classId, "events", event.id, "history"));
}

export async function addEvent(actor: Actor, classId: string, input: EventInput) {
  const ref = await addDoc(collection(db, "classes", classId, "events"), {
    ...clean(input),
    classId,
    createdBy: actor.uid,
    createdByName: actor.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    confirmations: [],
  });
  await setDoc(historyRef({ classId, id: ref.id }), { action: "created", by: actor.uid, byName: actor.name, at: serverTimestamp() });
}

/** Returns true if confirmations were reset. */
export async function editEvent(actor: Actor, event: ClassEvent, input: EventInput) {
  const next = clean(input);
  const changes: Record<string, { from: string; to: string }> = {};
  for (const f of FIELDS) {
    const from = String(event[f] ?? "");
    const to = String(next[f] ?? "");
    if (from !== to) changes[f] = { from, to };
  }
  if (!Object.keys(changes).length) return false;
  const reset = CORE_FIELDS.some((f) => f in changes);
  const batch = writeBatch(db);
  batch.update(doc(db, "classes", event.classId, "events", event.id), {
    ...next,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
    ...(reset ? { confirmations: [] } : {}),
  });
  batch.set(historyRef(event), { action: "edited", by: actor.uid, byName: actor.name, at: serverTimestamp(), changes });
  await batch.commit();
  return reset;
}

export async function setConfirmation(actor: Actor, event: ClassEvent, confirmed: boolean) {
  const batch = writeBatch(db);
  batch.update(doc(db, "classes", event.classId, "events", event.id), {
    confirmations: confirmed ? arrayUnion(actor.uid) : arrayRemove(actor.uid),
  });
  batch.set(historyRef(event), { action: confirmed ? "confirmed" : "unconfirmed", by: actor.uid, byName: actor.name, at: serverTimestamp() });
  await batch.commit();
}

export const isVerified = (e: ClassEvent) => (e.confirmations?.length || 0) >= VERIFY_THRESHOLD;

/** Added or changed by a classmate since the student last marked the class as seen. */
export function isNewForMe(e: ClassEvent, uid: string, lastSeenAt: Date | null | undefined) {
  if (e.createdBy === uid && (!e.updatedBy || e.updatedBy === uid)) return false;
  if (!lastSeenAt) return true;
  const changed = e.updatedAt?.toDate?.() ?? e.createdAt?.toDate?.();
  return Boolean(changed && changed > lastSeenAt && (e.updatedBy ?? e.createdBy) !== uid);
}

/* ── Sessions & notes ─────────────────────────────────────────── */

export async function createSession(actor: Actor, classId: string, input: { date: string; topic: string }) {
  const ref = await addDoc(collection(db, "classes", classId, "sessions"), {
    classId,
    date: input.date,
    topic: input.topic.trim(),
    createdBy: actor.uid,
    createdByName: actor.name,
    createdAt: serverTimestamp(),
    contributors: [],
    merged: null,
  });
  return ref.id;
}

export async function renameSession(classId: string, sessionId: string, topic: string) {
  await updateDoc(doc(db, "classes", classId, "sessions", sessionId), { topic: topic.trim() || "Untitled lesson" });
}

/** Saves the signed-in student's own note (one per student per session). */
export async function saveMyNote(actor: Actor, classId: string, sessionId: string, html: string, text: string) {
  const batch = writeBatch(db);
  batch.set(doc(db, "classes", classId, "sessions", sessionId, "notes", actor.uid), {
    authorId: actor.uid,
    authorName: actor.name,
    html,
    text,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "classes", classId, "sessions", sessionId), {
    contributors: text.trim() ? arrayUnion(actor.uid) : arrayRemove(actor.uid),
  });
  await batch.commit();
}

export async function saveMergedNote(actor: Actor, classId: string, sessionId: string, merged: MergedNote) {
  await updateDoc(doc(db, "classes", classId, "sessions", sessionId), {
    merged: { ...merged, mergedAt: serverTimestamp(), mergedByName: actor.name },
  });
}

/* ── Live hooks ───────────────────────────────────────────────── */

export function useMyClasses(uid: string | undefined) {
  const [state, setState] = useState<{ data: ClassRoom[]; loading: boolean }>({ data: [], loading: true });
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "classes"), where("memberIds", "array-contains", uid));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassRoom);
        data.sort((a, b) => a.course.localeCompare(b.course));
        setState({ data, loading: false });
      },
      () => setState({ data: [], loading: false }),
    );
  }, [uid]);
  return state;
}

/** Live listener per class, merged into one sorted list. */
function useAcrossClasses<T>(classIds: string[], sub: string, map: (id: string, data: object, classId: string) => T, sort: (a: T, b: T) => number) {
  const key = classIds.slice().sort().join(",");
  const [byClass, setByClass] = useState<Record<string, T[]>>({});
  useEffect(() => {
    if (!key) return;
    const unsubs = key.split(",").map((cid) =>
      onSnapshot(
        collection(db, "classes", cid, sub),
        (snap) => setByClass((prev) => ({ ...prev, [cid]: snap.docs.map((d) => map(d.id, d.data(), cid)) })),
        () => {},
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sub]);
  return useMemo(
    () => (key ? key.split(",").flatMap((cid) => byClass[cid] || []) : []).sort(sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byClass, key],
  );
}

export function useEvents(classIds: string[]) {
  return useAcrossClasses<ClassEvent>(
    classIds,
    "events",
    (id, data, classId) => ({ id, classId, confirmations: [], ...data }) as unknown as ClassEvent,
    (a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
  );
}

export function useSessions(classIds: string[]) {
  return useAcrossClasses<Session>(
    classIds,
    "sessions",
    (id, data, classId) => ({ id, classId, contributors: [], ...data }) as unknown as Session,
    (a, b) => b.date.localeCompare(a.date),
  );
}

/** The signed-in student's membership doc for each class (for lastSeenAt). */
export function useMyMemberships(classIds: string[], uid: string | undefined) {
  const key = classIds.slice().sort().join(",");
  const [map, setMap] = useState<Record<string, Member>>({});
  useEffect(() => {
    if (!uid || !key) return;
    const unsubs = key.split(",").map((cid) =>
      onSnapshot(
        doc(db, "classes", cid, "members", uid),
        (snap) => snap.exists() && setMap((prev) => ({ ...prev, [cid]: { uid, ...snap.data() } as Member })),
        () => {},
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [key, uid]);
  return map;
}

export function useEventHistory(classId: string, eventId: string) {
  const [data, setData] = useState<EventHistory[]>([]);
  useEffect(() => {
    const q = query(collection(db, "classes", classId, "events", eventId, "history"), orderBy("at", "desc"));
    return onSnapshot(q, (snap) => setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventHistory)), () => {});
  }, [classId, eventId]);
  return data;
}

export function useSession(classId: string, sessionId: string) {
  const [state, setState] = useState<{ data: Session | null; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    return onSnapshot(
      doc(db, "classes", classId, "sessions", sessionId),
      (snap) => setState({ data: snap.exists() ? ({ id: snap.id, contributors: [], ...snap.data() } as unknown as Session) : null, loading: false }),
      () => setState({ data: null, loading: false }),
    );
  }, [classId, sessionId]);
  return state;
}

export function useNotes(classId: string, sessionId: string) {
  const [state, setState] = useState<{ data: Note[]; loading: boolean }>({ data: [], loading: true });
  useEffect(() => {
    return onSnapshot(
      collection(db, "classes", classId, "sessions", sessionId, "notes"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, html: "", text: "", ...d.data() }) as Note);
        data.sort((a, b) => (a.updatedAt?.toMillis?.() ?? 0) - (b.updatedAt?.toMillis?.() ?? 0));
        setState({ data, loading: false });
      },
      () => setState({ data: [], loading: false }),
    );
  }, [classId, sessionId]);
  return state;
}
