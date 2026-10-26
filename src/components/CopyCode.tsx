"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** large: a big display; compact: fits in a 30px bar (the class filter) without making it taller. */
export function CopyCode({ code, large, compact }: { code: string; large?: boolean; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — the code is still visible */
        }
      }}
      className={clsx(
        "group inline-flex items-center gap-2 rounded-xl border border-dashed border-navy-600/60 bg-gold-50 font-mono font-bold tracking-[0.2em] text-navy-900 transition hover:border-solid hover:bg-gold-100",
        large ? "px-4 py-2 text-xl" : compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
      )}
      title="Copy class code"
    >
      {code}
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />}
    </button>
  );
}
