"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/lib/auth-context";
import { useCalculatorState } from "@/lib/calculator/store";
import { useAllClasses, useAllEvents, useAnnouncements, useEvents, useSessions } from "@/lib/db";
import { useWorkspace } from "./workspace";

/**
 * What the tabs show, loaded once and kept for the whole visit. A page used to
 * subscribe on open and drop everything on leave, so every tab switch started
 * from an empty screen; now the data is already here when a tab opens.
 */
function useTabData() {
  const { actor, classes } = useWorkspace();
  const { user } = useAuth();
  const classIds = useMemo(() => classes.map((c) => c.id), [classes]);
  const admin = isAdminEmail(user?.email);
  return {
    /** Every entry in every class I'm in. */
    events: useEvents(classIds),
    /** Every note page in every class I'm in. */
    sessions: useSessions(classIds),
    announcements: useAnnouncements(),
    calculator: useCalculatorState(actor.uid),
    /** Admin only: every class and entry in the project. */
    adminEvents: useAllEvents(admin),
    adminClasses: useAllClasses(admin),
  };
}

const Ctx = createContext<ReturnType<typeof useTabData> | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useTabData()}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
