"use client";

import { useEffect, useState } from "react";
import { postWithAuth } from "../api";

// Kept for as long as the page stays loaded: switching tabs doesn't change a message, a refresh writes new ones.
const messages = new Map<string, string>();
const asked = new Set<string>();

/**
 * An encouraging message from ChatGPT for each course, written fresh on every page load. One request covers
 * every course that hasn't been asked about yet; only the course names are sent. If it fails (no API key,
 * offline, rate limit) there are simply no messages, and it isn't retried until the next refresh.
 */
export function useEncouragement(courses: string[]) {
  const [, update] = useState(0);
  const key = courses.join("\u0000");

  useEffect(() => {
    const missing = (key ? key.split("\u0000") : []).filter((c) => !asked.has(c));
    if (!missing.length) return;
    missing.forEach((c) => asked.add(c));
    postWithAuth<{ messages: string[] }>("/api/encourage", { courses: missing })
      .then((res) => {
        missing.forEach((c, i) => res.messages[i] && messages.set(c, res.messages[i]));
        update((n) => n + 1);
      })
      .catch((err) => console.warn("[encourage]", (err as Error).message));
  }, [key]);

  return (course: string) => messages.get(course);
}
