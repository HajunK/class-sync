import { cleanCourses, generateEncouragement } from "@/lib/encourage";
import { verifyRequestUser } from "@/lib/server/verify-user";

/** One short encouraging message per course (GPT). Only the course names are sent, never grades. */
export async function POST(request: Request) {
  const uid = await verifyRequestUser(request);
  if (!uid) return Response.json({ error: "Please sign in again." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return Response.json({ error: "Messages need an OpenAI API key (OPENAI_API_KEY in .env.local)." }, { status: 503 });

  let courses: string[];
  try {
    courses = cleanCourses((await request.json())?.courses);
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!courses.length) return Response.json({ error: "No courses given." }, { status: 400 });

  try {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    return Response.json({ messages: await generateEncouragement(courses, apiKey, model) });
  } catch (err) {
    console.error("[encourage]", err);
    const status = (err as { status?: number })?.status;
    return Response.json({ error: status === 429 ? "OpenAI rate limit or quota reached." : "Couldn't write messages right now." }, { status: 502 });
  }
}
