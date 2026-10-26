"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { setUserTheme } from "@/lib/db";
import { applyTheme, currentTheme, isThemeId, THEMES, type ThemeId } from "@/lib/theme";

/**
 * Applies the theme saved on your account. A theme you picked on another device wins when you sign in here.
 * Runs all the time (not only while the account menu is open).
 */
export function useAccountTheme() {
  const { profile } = useAuth();
  useEffect(() => {
    const saved = profile?.theme;
    if (isThemeId(saved) && saved !== currentTheme()) applyTheme(saved, false);
  }, [profile?.theme]);
}

/**
 * A row for the account menu: three dots, one per theme. Picking one recolors the whole app at once. It's saved to
 * your account (so it follows you to other devices) and remembered in this browser (so it's right from first paint).
 */
export function ThemeSwitcher() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeId>(currentTheme);

  function choose(id: ThemeId) {
    if (id === theme) return;
    setTheme(id);
    applyTheme(id);
    if (user) setUserTheme(user.uid, id).catch(() => toast.error("Couldn't save your theme. It will reset on your other devices."));
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span id="theme-label" className="text-sm text-muted">
        Theme
      </span>
      <div role="radiogroup" aria-labelledby="theme-label" className="flex items-center">
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${t.name} theme`}
              title={`${t.name} theme`}
              onClick={() => choose(t.id)}
              className="group flex h-8 w-8 items-center justify-center rounded-full"
            >
              <span
                className={clsx(
                  "block h-5 w-5 rounded-full transition-all duration-200",
                  active ? "scale-100 ring-2 ring-navy-900 ring-offset-2 ring-offset-white" : "scale-90 ring-1 ring-black/10 group-hover:scale-100",
                )}
                style={{ background: t.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
