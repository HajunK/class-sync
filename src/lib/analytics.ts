"use client";

import { initializeAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { app, usingEmulator } from "./firebase";

let ready: Promise<Analytics | null> | null = null;

/**
 * Google Analytics through Firebase. It stays off in emulator mode, when there's no Measurement ID
 * (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID), and in browsers that can't run it or block it.
 */
function analytics() {
  ready ??= (async () => {
    if (usingEmulator || !process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return null;
    try {
      if (!(await isSupported())) return null;
      // Page views are sent by hand on every route change: this app switches pages without reloading.
      return initializeAnalytics(app, { config: { send_page_view: false } });
    } catch {
      return null;
    }
  })();
  return ready;
}

/** Records that a page was viewed. Only the page address is sent: no names, emails, or grades. */
export async function trackPageView(path: string) {
  const a = await analytics();
  if (a) logEvent(a, "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
}
