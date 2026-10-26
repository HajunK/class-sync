import OpenAI from "openai";

/** Most courses we'll ask about in one request, and the longest course name we'll pass on. */
export const MAX_COURSES = 30;
export const MAX_COURSE_NAME = 80;
const MAX_MESSAGE_CHARS = 140;

const SYSTEM = `You write one short, warm, encouraging message for a high school student about each school subject they are taking.

Rules:
- Make each message specific to its subject: what students actually do in it and what trips them up (math: careless calculation mistakes; science: reviewing labs and units; writing: proofreading; languages: practicing a little every day; history: connecting causes and effects; music and art: patience and practice; and so on).
- Sound like a supportive friend giving one concrete, punchy tip, not a teacher giving a lecture. Speak to the student as "you". Friendly and upbeat, never pushy or preachy.
- Vary the shape: some are a gentle command ("Read every question twice!"), some a reminder, some a cheer. Don't start two messages with the same word, and use an exclamation mark on only some of them.
- Under 15 words each. No emojis, no hashtags, no quotation marks.
- Never mention grades, scores, or ranking. Don't scold.
- Name the subject in the message when it reads naturally.
- Every message must be different from the others, and fresh each time you are asked, so vary your wording and angle.

Examples of the tone:
- Algebra: Don't make calculation mistakes on your next Algebra test!
- Biology: Read every question twice before you answer. You know more than you think.
- Korean: Say five new words out loud today. Your future self will thank you!

Reply with JSON only: {"messages": [{"index": 1, "message": "..."}, ...]} with one entry per numbered course.`;

/** Cleans up the course list before it goes to the model: trimmed, no repeats, capped. */
export function cleanCourses(input: unknown): string[] {
  const names = Array.isArray(input) ? input : [];
  return Array.from(new Set(names.map((n) => String(n ?? "").trim().slice(0, MAX_COURSE_NAME)).filter(Boolean))).slice(0, MAX_COURSES);
}

/** Lines up the model's reply with the courses asked about: one string per course, empty where it gave nothing usable. */
export function parseMessages(raw: string, count: number): string[] {
  const out = Array.from({ length: count }, () => "");
  let entries: unknown;
  try {
    entries = (JSON.parse(raw) as { messages?: unknown })?.messages;
  } catch {
    return out;
  }
  if (!Array.isArray(entries)) return out;
  for (const e of entries as { index?: unknown; message?: unknown }[]) {
    const i = Number(e?.index) - 1;
    if (!Number.isInteger(i) || i < 0 || i >= count || typeof e?.message !== "string") continue;
    const message = e.message.trim().replace(/^["“”']+|["“”']+$/g, "").replace(/\s+/g, " ").trim();
    if (message && message.length <= MAX_MESSAGE_CHARS) out[i] = message;
  }
  return out;
}

export async function generateEncouragement(courses: string[], apiKey: string, model: string): Promise<string[]> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model,
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Courses:\n${courses.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nVariation seed: ${Math.random().toString(36).slice(2, 8)}` },
    ],
  });
  return parseMessages(completion.choices[0]?.message?.content || "", courses.length);
}
