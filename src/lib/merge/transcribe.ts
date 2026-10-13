import OpenAI from "openai";

const PROMPT = `This is a photo of a student's class notes (handwritten or printed, possibly a whiteboard).
Transcribe it faithfully into plain text so it can be merged with classmates' notes.

Rules:
- Write exactly what is on the page. Do not add explanations, corrections, or information that is not there.
- Keep the structure: write headings as "# Heading" on their own line and bullet points as "- item".
- Keep emphasis the student used (★, !!, "on the test"); for circled or underlined text add "(underlined)".
- Write math and chemistry in plain text (x^2, H2O, ->).
- For a diagram, write one short line like "[Diagram: arrow from glucose to 2 pyruvate]".
- If a word can't be read, write [illegible]. If the photo contains no notes at all, reply with exactly: NO_NOTES_FOUND
- Use the same language the notes are written in.

Reply with the transcription only.`;

export async function transcribeImage(dataUrl: string, apiKey: string, model: string) {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() || "";
  return text === "NO_NOTES_FOUND" ? "" : text;
}
