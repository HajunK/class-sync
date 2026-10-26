/** Small helpers for recording speech and typing it into a note. No browser or server code, so they can be tested. */

/** A recording stops by itself after this long. */
export const MAX_RECORDING_SECONDS = 300;
/** The biggest recording the server accepts (OpenAI's own limit is 25 MB). */
export const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

// In order of preference: Chrome, Firefox and Edge record webm; Safari records mp4.
const RECORDING_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

/** The first recording format the browser supports, or "" to let it choose. */
export const pickRecordingType = (supports: (type: string) => boolean) => RECORDING_TYPES.find(supports) ?? "";

/** The file extension OpenAI needs to recognize the recording's format. */
export function extensionFor(mime: string) {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  return "webm";
}

/** 75 → "1:15" */
export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** The text to type in: trimmed, with a space first when it would otherwise run into the character before the cursor. */
export function spokenText(charBefore: string, text: string) {
  const t = text.trim();
  if (!t) return "";
  return charBefore && !/\s/.test(charBefore) ? ` ${t}` : t;
}
