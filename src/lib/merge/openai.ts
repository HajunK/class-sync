import OpenAI from "openai";
import { normalizeResult, type MergeRequest, type MergeResult } from "./shared";

const SYSTEM_PROMPT = `You combine several students' notes from the SAME class session into ONE complete, organized class note.
Each student wrote down different things (board work, the teacher's explanations, test hints), so the combined note must contain the union of everything they wrote.

How to merge:
1. Inventory: first list every distinct statement in every note (one row per fact, idea, example, definition, reminder, or opinion), with its source.
2. Group related statements under clear section headings that follow the flow of the lesson.
3. Remove ONLY true duplicates — statements that say the same thing. Write that point once, keep the most detailed wording, add any extra detail the other versions mention, and cite ALL of those notes as sources.
4. Keep details that appear in only one student's note. Never drop a statement because it seems minor, informal, or because only one student wrote it. Two statements about the same topic that say different things are NOT duplicates — keep both.
5. Do not invent anything that isn't in the notes. Light rewording for clarity is fine; keep specific numbers, names, examples, and wording.

Every row of the inventory must end up in "sections" (or "keyTerms"/"conflicts"). The combined note should normally have at least as many items as the longest single note.

Item kinds:
- "definition": a term and its meaning.
- "example": a worked example or sample problem.
- "test": the note explicitly says this will be on a quiz/test/exam or is important for assessment (★, "on the test", "memorize"). Merely containing the word "test" does NOT make it a test item.
- otherwise "point".

Disagreements ("conflicts"):
- Only when two notes state the SAME fact (same quantity, date, formula, name, definition) in ways that cannot both be true, e.g. "36 ATP" vs "38 ATP", "quiz Friday" vs "quiz Thursday".
- Different opinions, feelings, or extra details are NOT conflicts — just include them all.
- For a real conflict, quote each version with its source and add a short neutral note on what to check. Don't silently pick one.

Write in the same language the notes are written in. Every item MUST cite at least one source label (e.g. "N1").

Respond with ONLY a JSON object of this exact shape (fill "inventory" first):
{
  "inventory": [ { "source": "N1", "text": string } ],
  "title": string,
  "overview": string,            // 2-3 sentence summary of the lesson
  "sections": [ { "heading": string, "items": [ { "text": string, "kind": "point"|"example"|"definition"|"test", "sources": ["N1", ...] } ] } ],
  "conflicts": [ { "topic": string, "versions": [ { "source": "N1", "text": string } ], "note": string } ],
  "keyTerms": [ { "term": string, "definition": string, "sources": ["N1", ...] } ]
}`;

export async function mergeWithOpenAI(req: MergeRequest, apiKey: string, model: string): Promise<MergeResult> {
  const client = new OpenAI({ apiKey });
  const aliases: Record<string, string> = {};
  const blocks = req.notes.map((n, i) => {
    const label = `N${i + 1}`;
    aliases[label] = n.id;
    return `### ${label} — by ${n.authorName}\n${n.content}`;
  });

  const userPrompt = `Course: ${req.course}
Session date: ${req.date}
Lesson topic: ${req.topic}

Here are ${req.notes.length} students' notes from this session:

${blocks.join("\n\n")}`;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content || "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The AI returned an unreadable response. Please try again.");
  }
  return { ...normalizeResult(parsed, req.notes, aliases), engine: "openai", model };
}
