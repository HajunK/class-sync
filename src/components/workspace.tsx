"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { displayNameOf, useAuth } from "@/lib/auth-context";
import { useMyClasses, useMyMemberships, type Actor } from "@/lib/db";
import type { ClassRoom, Member } from "@/lib/types";

interface Workspace {
  actor: Actor;
  classes: ClassRoom[];
  classesLoading: boolean;
  classById: Record<string, ClassRoom>;
  memberships: Record<string, Member>;
  /** null = all classes */
  selectedId: string | null;
  select: (id: string | null) => void;
  /** The classes currently in view (selected one, or all). */
  visible: ClassRoom[];
}

const Ctx = createContext<Workspace | null>(null);
const KEY = "classsync:selected-class";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const actor = { uid: user!.uid, name: displayNameOf(user, profile) };
  const { data: rawClasses, loading } = useMyClasses(actor.uid);
  const classIds = useMemo(() => rawClasses.map((c) => c.id), [rawClasses]);
  const memberships = useMyMemberships(classIds, actor.uid);
  // Each student's own color choice wins over the class's color, everywhere a class is shown.
  const classes = useMemo(
    () => rawClasses.map((c) => (memberships[c.id]?.color ? { ...c, color: memberships[c.id].color! } : c)),
    [rawClasses, memberships],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Remember the selected class between visits (per browser).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setSelectedId(saved);
    } catch {}
  }, []);
  const select = (id: string | null) => {
    setSelectedId(id);
    try {
      if (id) localStorage.setItem(KEY, id);
      else localStorage.removeItem(KEY);
    } catch {}
  };

  const classById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const validSelected = selectedId && classById[selectedId] ? selectedId : null;
  const visible = useMemo(() => (validSelected ? classes.filter((c) => c.id === validSelected) : classes), [classes, validSelected]);

  return (
    <Ctx.Provider
      value={{ actor, classes, classesLoading: loading, classById, memberships, selectedId: validSelected, select, visible }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
