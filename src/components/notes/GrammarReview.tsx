"use client";

import type { Editor } from "@tiptap/react";
import clsx from "clsx";
import { Check, Loader2, SpellCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { postWithAuth } from "@/lib/api";
import { diffWords } from "@/lib/diff";
import { countWords, MAX_REWRITE_CHARS, MIN_WORDS_FOR_STYLE, type RewriteMode } from "@/lib/rewrite-shared";

interface Picked {
  from: number;
  to: number;
  text: string;
}
type Step = { kind: "idle" } | { kind: "loading" } | { kind: "suggest"; suggestion: string; mode: RewriteMode };

/** What each option is called, what its suggestion card says, and what it says when nothing changes. */
const MODES: Record<RewriteMode, { label: string; heading: string; unchanged: string }> = {
  grammar: { label: "Review Grammar", heading: "Suggested rewrite", unchanged: "Looks good. No changes needed." },
  formal: { label: "More formal", heading: "More formal version", unchanged: "Already formal. No changes suggested." },
  concise: { label: "More concise", heading: "More concise version", unchanged: "Already concise. No changes suggested." },
};

const IDLE: Step = { kind: "idle" };
const CARD_WIDTH = 340;
const PILL_WIDTH = 150;
/** Width of the pill when it also offers "More formal" and "More concise". */
const PILL_WIDTH_WIDE = 370;
/** The sticky header ends here; nothing of ours goes above it. */
const TOP_LIMIT = 72;
const PILL_HEIGHT = 34;
/** A suggestion card goes above the text if there's this much room there; otherwise on whichever side has more. */
const PREFERRED_CARD_ROOM = 260;
/** Less room than this on both sides (the selection fills the screen) and the card floats at the top instead. */
const MIN_CARD_ROOM = 140;

/**
 * Select text in a note and a "Review Grammar" pill appears over it; over 10 words it also offers
 * "More formal" and "More concise". Pressing one sends the selection to GPT; the result comes back
 * as a suggestion that shows what changed, which you can accept (replaces your text) or dismiss.
 */
export function GrammarReview({ editor }: { editor: Editor }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pos, setPos] = useState<{ x: number; top: number; bottom: number } | null>(null);
  const [step, setStep] = useState<Step>(IDLE);
  const pickedRef = useRef<Picked | null>(null);
  // Bumped whenever the selection changes, so a late reply for an old selection is ignored.
  const request = useRef(0);

  useEffect(() => {
    // The selected text if it sits inside one paragraph; otherwise null.
    const read = (): Picked | null => {
      const { from, to, empty, $from, $to } = editor.state.selection;
      if (empty || !editor.isFocused || !$from.sameParent($to)) return null;
      const text = editor.state.doc.textBetween(from, to, " ");
      return text.trim() ? { from, to, text } : null;
    };
    const place = (p: Picked) => {
      const a = editor.view.coordsAtPos(p.from);
      const b = editor.view.coordsAtPos(p.to);
      setPos({ x: a.top === b.top ? (a.left + b.left) / 2 : a.left, top: a.top, bottom: b.bottom });
    };
    const sync = () => {
      const next = read();
      const prev = pickedRef.current;
      if (!next || !prev || next.from !== prev.from || next.to !== prev.to || next.text !== prev.text) {
        request.current++;
        setStep(IDLE);
      }
      pickedRef.current = next;
      setPicked(next);
      if (next) place(next);
      else setPos(null);
    };
    editor.on("selectionUpdate", sync);
    editor.on("update", sync);
    editor.on("focus", sync);
    editor.on("blur", sync);
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("update", sync);
      editor.off("focus", sync);
      editor.off("blur", sync);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [editor]);

  // Escape dismisses a suggestion.
  useEffect(() => {
    if (step.kind === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        request.current++;
        setStep(IDLE);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step.kind]);

  const diff = useMemo(() => (step.kind === "suggest" && picked ? diffWords(picked.text, step.suggestion) : []), [step, picked]);

  async function review(mode: RewriteMode) {
    if (!picked) return;
    if (picked.text.length > MAX_REWRITE_CHARS) {
      return void toast.error(`Select a shorter passage (up to ${MAX_REWRITE_CHARS.toLocaleString("en-US")} characters).`);
    }
    const id = ++request.current;
    setStep({ kind: "loading" });
    try {
      const { suggestion } = await postWithAuth<{ suggestion: string }>("/api/rewrite-text", { text: picked.text, mode });
      if (id !== request.current) return;
      setStep({ kind: "suggest", suggestion: suggestion.replace(/\s*\n\s*/g, " ").trim(), mode });
    } catch (err) {
      if (id !== request.current) return;
      toast.error((err as Error).message);
      setStep(IDLE);
    }
  }

  function accept() {
    if (step.kind !== "suggest" || !picked) return;
    // Plain text node, so characters like < and & stay literal.
    editor.chain().focus().insertContentAt({ from: picked.from, to: picked.to }, { type: "text", text: step.suggestion }).run();
    request.current++;
    setStep(IDLE);
  }

  if (!picked || !pos) return null;

  const showCard = step.kind === "suggest";
  const styleOptions = countWords(picked.text) > MIN_WORDS_FOR_STYLE;
  const width = showCard ? CARD_WIDTH : styleOptions ? PILL_WIDTH_WIDE : PILL_WIDTH;
  const x = Math.min(Math.max(pos.x, width / 2 + 8), window.innerWidth - width / 2 - 8);
  const vh = window.innerHeight;
  let style: React.CSSProperties;
  let cardMax = 0;
  if (showCard) {
    // The card hugs the selection from the side with room, and scrolls inside if the suggestion is longer than that.
    const roomAbove = pos.top - 8 - TOP_LIMIT;
    const roomBelow = vh - (pos.bottom + 8) - 8;
    if (Math.max(roomAbove, roomBelow) < MIN_CARD_ROOM) {
      style = { left: x, top: TOP_LIMIT };
      cardMax = vh - TOP_LIMIT - 8;
    } else if (roomAbove >= PREFERRED_CARD_ROOM || roomAbove > roomBelow) {
      style = { left: x, bottom: vh - (pos.top - 8) };
      cardMax = roomAbove;
    } else {
      style = { left: x, top: pos.bottom + 8 };
      cardMax = roomBelow;
    }
  } else {
    // The pill sits above the selection when there's room under the header, else below; always on screen.
    const wanted = pos.top - 8 - PILL_HEIGHT >= TOP_LIMIT ? pos.top - 8 - PILL_HEIGHT : pos.bottom + 8;
    style = { left: x, top: Math.min(Math.max(wanted, TOP_LIMIT), vh - PILL_HEIGHT - 8) };
  }
  style = { ...style, transform: "translateX(-50%)" };
  // Pressing these must not take focus from the editor, or the selection would be lost.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return createPortal(
    <div className="fixed z-40" style={style} onMouseDown={keepSelection}>
      {step.kind === "idle" && (
        <div className="flex items-center divide-x divide-line overflow-hidden rounded-full border border-line bg-white shadow-[var(--shadow-lift)]">
          {(styleOptions ? (["grammar", "formal", "concise"] as const) : (["grammar"] as const)).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => review(mode)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-navy-900 transition hover:bg-navy-50"
            >
              {mode === "grammar" && <SpellCheck className="h-3.5 w-3.5" />}
              {MODES[mode].label}
            </button>
          ))}
        </div>
      )}

      {step.kind === "loading" && (
        <div role="status" aria-label="Rewriting" className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white shadow-[var(--shadow-lift)]">
          <Loader2 className="h-4 w-4 animate-spin text-navy-900" />
        </div>
      )}

      {showCard && (
        <div
          className="flex w-[340px] max-w-[calc(100vw-16px)] flex-col rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-lift)]"
          style={{ maxHeight: cardMax }}
          role="dialog"
          aria-label="Grammar suggestion"
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            {step.suggestion.trim() === picked.text.trim() ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <Check className="h-4 w-4 text-emerald-600" /> {MODES[step.mode].unchanged}
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted">{MODES[step.mode].heading}</p>
                <p className="mt-2 text-sm leading-relaxed break-words text-ink">
                  {diff.map((part, i) => (
                    <span
                      key={i}
                      className={clsx(
                        part.kind === "del" && "text-red-700 line-through decoration-red-300",
                        part.kind === "add" && "rounded bg-emerald-50 font-semibold text-emerald-800",
                      )}
                    >
                      {part.text}{" "}
                    </span>
                  ))}
                </p>
              </>
            )}
          </div>
          <div className="mt-3.5 flex shrink-0 justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                request.current++;
                setStep(IDLE);
              }}
            >
              {step.suggestion.trim() === picked.text.trim() ? "Close" : "Dismiss"}
            </button>
            {step.suggestion.trim() !== picked.text.trim() && (
              <button type="button" className="btn btn-primary btn-sm" onClick={accept}>
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
