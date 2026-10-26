import OpenAI from "openai";
import { MAX_AUDIO_BYTES } from "@/lib/dictation";
import { verifyRequestUser } from "@/lib/server/verify-user";

/** Turns a recording into text with OpenAI's speech model. The audio is passed along and not stored. */
export async function POST(request: Request) {
  const uid = await verifyRequestUser(request);
  if (!uid) return Response.json({ error: "Please sign in again." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return Response.json({ error: "Speech to text needs an OpenAI API key (OPENAI_API_KEY in .env.local)." }, { status: 503 });

  let audio: FormDataEntryValue | null;
  try {
    audio = (await request.formData()).get("audio");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!(audio instanceof File) || audio.size === 0) return Response.json({ error: "No recording received." }, { status: 400 });
  if (audio.size > MAX_AUDIO_BYTES) return Response.json({ error: "That recording is too long. Keep it under 5 minutes." }, { status: 413 });
  if (!/^(audio|video)\//.test(audio.type)) return Response.json({ error: "That doesn't look like a recording." }, { status: 400 });

  try {
    const client = new OpenAI({ apiKey });
    // No language is given, so it works out English, Korean, or a mix by itself.
    const result = await client.audio.transcriptions.create({
      file: audio,
      model: process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-mini-transcribe",
    });
    return Response.json({ text: (result.text || "").trim() });
  } catch (err) {
    console.error("[speech-to-text]", err);
    const status = (err as { status?: number })?.status;
    const message =
      status === 401
        ? "The OpenAI API key was rejected. Check OPENAI_API_KEY in .env.local."
        : status === 429
          ? "OpenAI rate limit or quota reached. Try again in a moment."
          : "Couldn't turn that recording into text. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
