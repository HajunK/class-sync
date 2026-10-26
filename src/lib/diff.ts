export interface DiffPart {
  text: string;
  kind: "same" | "add" | "del";
}

const MAX_CELLS = 250_000;

/** Word-by-word changes from `before` to `after`: what stayed, what was removed, what was added. */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = before.split(/\s+/).filter(Boolean);
  const b = after.split(/\s+/).filter(Boolean);
  // Too long to compare cheaply: show it as one replacement.
  if (a.length * b.length > MAX_CELLS) {
    return [a.length && { text: a.join(" "), kind: "del" as const }, b.length && { text: b.join(" "), kind: "add" as const }].filter(Boolean) as DiffPart[];
  }

  // Longest common subsequence of words.
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const parts: DiffPart[] = [];
  const push = (word: string, kind: DiffPart["kind"]) => {
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.text += ` ${word}`;
    else parts.push({ text: word, kind });
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push(a[i++], "same");
      j++;
    }
    // On a tie the removed word comes first, so a swap reads "are → is".
    else if (i < a.length && (j === b.length || lcs[i + 1][j] >= lcs[i][j + 1])) push(a[i++], "del");
    else push(b[j++], "add");
  }
  return parts;
}
