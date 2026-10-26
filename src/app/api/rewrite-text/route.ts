import { rewriteText } from "@/lib/rewrite";
import { isRewriteMode, MAX_REWRITE_CHARS } from "@/lib/rewrite-shared";
import { verifyRequestUser } from "@/lib/server/verify-user";

/** Rewrites a selected passage of a note: fix grammar, or make it more formal or more concise (GPT). */
export async function POST(request: Request) {
  const uid = await verifyRequestUser(request);
  if (!uid) return Response.json({ error: "Please sign in again." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "Rewriting needs an OpenAI API key (OPENAI_API_KEY in .env.local)." }, { status: 503 });
  }

  let text = "";
  let mode: unknown;
  try {
    const body = await request.json();
    text = String(body?.text || "").trim();
    mode = body?.mode ?? "grammar";
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!isRewriteMode(mode)) return Response.json({ error: "Unknown rewrite type." }, { status: 400 });
  if (!text) return Response.json({ error: "Select some text first." }, { status: 400 });
  if (text.length > MAX_REWRITE_CHARS) {
    return Response.json({ error: `Select a shorter passage (up to ${MAX_REWRITE_CHARS.toLocaleString("en-US")} characters).` }, { status: 400 });
  }

  try {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    return Response.json({ suggestion: await rewriteText(text, mode, apiKey, model) });
  } catch (err) {
    console.error("[rewrite-text]", err);
    const status = (err as { status?: number })?.status;
    const message =
      status === 401
        ? "The OpenAI API key was rejected. Check OPENAI_API_KEY in .env.local."
        : status === 429
          ? "OpenAI rate limit or quota reached. Try again in a moment."
          : "Couldn't rewrite this text. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
