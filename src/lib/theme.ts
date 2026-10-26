/** The color themes a student can pick. Blue is the default; the others are set on <html data-theme="…"> (see globals.css). */
export const THEMES = [
  { id: "blue", name: "Blue", color: "#1f3fb5" },
  { id: "green", name: "Green", color: "#0b6e4f" },
  { id: "purple", name: "Purple", color: "#6d28d9" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "blue";
export const THEME_KEY = "classsync:theme";

export const isThemeId = (value: unknown): value is ThemeId => THEMES.some((t) => t.id === value);

/** Runs before the page first paints, so a saved theme never flashes blue first. Blue needs no attribute. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="green"||t==="purple")document.documentElement.dataset.theme=t}catch(e){}`;

export function currentTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const set = document.documentElement.dataset.theme;
  return isThemeId(set) ? set : DEFAULT_THEME;
}

/** Switches the whole app to a theme and remembers it in this browser. The colors fade over a third of a second. */
export function applyTheme(id: ThemeId, animate = true) {
  const root = document.documentElement;
  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-fade");
    setTimeout(() => root.classList.remove("theme-fade"), 450);
  }
  if (id === DEFAULT_THEME) delete root.dataset.theme;
  else root.dataset.theme = id;
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* private window: the choice just isn't remembered here */
  }
}
