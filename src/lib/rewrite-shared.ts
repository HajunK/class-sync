/** What the "rewrite" menu can ask for. Safe to import in the browser (no server code). */
export const REWRITE_MODES = ["grammar", "formal", "concise"] as const;
export type RewriteMode = (typeof REWRITE_MODES)[number];

/** The longest passage we'll send, in characters. */
export const MAX_REWRITE_CHARS = 1500;

/** "More formal" and "More concise" only appear for selections longer than this many words. */
export const MIN_WORDS_FOR_STYLE = 10;

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

export const isRewriteMode = (value: unknown): value is RewriteMode => REWRITE_MODES.includes(value as RewriteMode);
