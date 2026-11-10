"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

/** Sends a page view to Google Analytics on load and every time you move to another page. Shows nothing. */
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    void trackPageView(pathname);
  }, [pathname]);
  return null;
}
