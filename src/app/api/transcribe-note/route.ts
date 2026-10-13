import { transcribeImage } from "@/lib/merge/transcribe";
import { verifyRequestUser } from "@/lib/server/verify-user";

// Photos are resized in the browser first; this is a generous cap.
const MAX_DATA_URL_CHARS = 6_000_000;

/** Converts a photo of handwritten notes into text (GPT vision). */
export async function POST(request: Request) {
  const uid = await verifyRequestUser(request);
  if (!uid) return Response.json({ error: "Please sign in again." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "Reading photos needs an OpenAI API key (OPENAI_API_KEY in .env.local)." }, { status: 503 });
  }

  let image = "";
  try {
    image = String((await request.json())?.image || "");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > MAX_DATA_URL_CHARS) {
    return Response.json({ error: "Please use a JPG, PNG, or WebP photo." }, { status: 400 });
  }

  try {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    return Response.json({ text: await transcribeImage(image, apiKey, model) });
  } catch (err) {
    console.error("[transcribe-note]", err);
    const status = (err as { status?: number })?.status;
    const message =
      status === 401
        ? "The OpenAI API key was rejected. Check OPENAI_API_KEY in .env.local."
        : status === 429
          ? "OpenAI rate limit or quota reached. Try again in a moment."
          : "Couldn't read this photo. Try a clearer, well-lit photo.";
    return Response.json({ error: message }, { status: 502 });
  }
}
