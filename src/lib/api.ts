"use client";

import { auth } from "./firebase";

/**
 * POST JSON to one of our API routes with the user's Firebase ID token.
 * If the server rejects the token (e.g. it went stale after the emulator
 * restarted), fetch a fresh token and try once more.
 */
export async function postWithAuth<T>(url: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("You're signed out. Please sign in again.");

  const send = async (forceRefresh: boolean) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken(forceRefresh)}` },
      body: JSON.stringify(body),
    });

  let res = await send(false);
  if (res.status === 401) {
    try {
      res = await send(true);
    } catch {
      throw new Error("Your sign-in expired. Please sign out and sign in again.");
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}
