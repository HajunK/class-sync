/** Turning OCR output into note text. No browser code in here, so it can be tested. */

export interface OcrWord {
  text: string;
  /** 0–100 */
  confidence: number;
}
export interface OcrLine {
  words: OcrWord[];
}

export const ILLEGIBLE = "[illegible]";
/** Words the OCR is less sure of than this are written as [illegible]. */
export const WORD_CONFIDENCE_THRESHOLD = 60;
/** If the average confidence is below this, the photo wasn't really read, so it isn't inserted. */
export const MIN_AVERAGE_CONFIDENCE = 50;

/** Text reads best as dark on light, so photos that are mostly dark (a dark-mode screenshot) get inverted first. */
export const shouldInvert = (meanGray: number) => meanGray < 115;

export function averageConfidence(words: OcrWord[]): number {
  return words.length ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length : 0;
}

/**
 * One line of text per OCR line. Unsure words become [illegible] (runs of them collapse into one), and a line
 * that is nothing but one or two unreadable words is dropped, since that's usually a stray mark or texture.
 */
export function linesToText(lines: OcrLine[], threshold = WORD_CONFIDENCE_THRESHOLD): string {
  return lines
    .map((line) => {
      const out: string[] = [];
      for (const word of line.words) {
        const text = word.confidence < threshold ? ILLEGIBLE : word.text.trim();
        if (!text || (text === ILLEGIBLE && out[out.length - 1] === ILLEGIBLE)) continue;
        out.push(text);
      }
      const unreadable = out.length > 0 && out.every((t) => t === ILLEGIBLE);
      return unreadable && line.words.length <= 2 ? "" : out.join(" ");
    })
    .filter(Boolean)
    .join("\n");
}
