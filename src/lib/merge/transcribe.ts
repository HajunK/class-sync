import OpenAI from "openai";

const PROMPT = `This image is a student's class material: a photo of handwritten or printed notes, a whiteboard, a slide, a textbook page, or a screenshot (possibly of a diagram with labels).
Transcribe everything readable into plain text so it can be merged with classmates' notes.

Rules:
- Write exactly what is on the page. Do not add explanations, corrections, or information that is not there.
- Keep the structure: write headings as "# Heading" on their own line and bullet points as "- item".
- Keep emphasis the student used (★, !!, "on the test"); for circled or underlined text add "(underlined)".
- Write math and chemistry in plain text (x^2, H2O, ->).
- For a diagram, chart, or figure, write every label exactly as printed, one per line as a bullet, keeping any symbols that are part of the label (↓ ↑ · &). Only when an arrow clearly joins two labeled things, add a line like "- A -> B". Do not guess links, and skip colors and decoration. A diagram that has text on it is notes: always transcribe it.
- If a word can't be read, write [illegible].
- Only if there is no readable text at all (a blank page, or a photo of something unrelated) reply with exactly: NO_NOTES_FOUND
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
