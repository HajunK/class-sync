import { ensureCoverage } from "@/lib/merge/coverage";
import { extraConflicts, mergeOffline } from "@/lib/merge/fallback";
import { mergeWithOpenAI } from "@/lib/merge/openai";
import type { MergeRequest } from "@/lib/merge/shared";
import { verifyRequestUser } from "@/lib/server/verify-user";

const MAX_NOTES = 12;
const MAX_CHARS_PER_NOTE = 12_000;

function aiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  return { apiKey, model };
}

/** Lets the UI show whether real AI merging is switched on. */
export async function GET() {
  const { apiKey, model } = aiConfig();
  return Response.json({ aiEnabled: Boolean(apiKey), model: apiKey ? model : null });
}

export async function POST(request: Request) {
  const uid = await verifyRequestUser(request);
  if (!uid) return Response.json({ error: "Please sign in again." }, { status: 401 });

  let body: MergeRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const notes = (Array.isArray(body?.notes) ? body.notes : [])
    .filter((n) => n && typeof n.content === "string" && n.content.trim())
    .slice(0, MAX_NOTES)
    .map((n) => ({
      id: String(n.id),
      authorName: String(n.authorName || "Student").slice(0, 80),
      content: n.content.slice(0, MAX_CHARS_PER_NOTE),
    }));

  if (notes.length < 1) return Response.json({ error: "Add at least one note before merging." }, { status: 400 });

  const req: MergeRequest = {
    course: String(body.course || "").slice(0, 200),
    topic: String(body.topic || "").slice(0, 200),
    date: String(body.date || "").slice(0, 20),
    notes,
  };

  const { apiKey, model } = aiConfig();
  try {
    let result = apiKey ? await mergeWithOpenAI(req, apiKey, model) : mergeOffline(req);
    if (result.engine === "openai") {
      // Models sometimes drop a detail or miss a clash in numbers/days. Double-check
      // with rule-based checks so nothing a student wrote is silently lost.
      result = ensureCoverage(req, result);
      result.conflicts.push(...extraConflicts(req, result.conflicts));
    }
    return Response.json({ result });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const message =
      status === 401
        ? "The OpenAI API key was rejected. Check OPENAI_API_KEY in .env.local."
        : status === 429
          ? "OpenAI rate limit or quota reached. Try again in a moment."
          : (err as Error)?.message || "Merging failed.";
    console.error("[merge-notes]", err);
    return Response.json({ error: message }, { status: 502 });
  }
}
