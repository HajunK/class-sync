"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";
import { CLASS_PALETTE, setClassColor } from "@/lib/db";
import type { ClassRoom } from "@/lib/types";
import { Popover } from "./ui";
import { useWorkspace } from "./workspace";

/** A palette to pick your own color for a class. The choice is saved to your account and only you see it. */
export function ClassColorPopover({
  cls,
  anchor,
  open,
  onClose,
}: {
  cls: ClassRoom | null;
  anchor: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
}) {
  const { actor, memberships } = useWorkspace();
  const hasOwnColor = !!(cls && memberships[cls.id]?.color);

  async function pick(color: string | null) {
    if (!cls) return;
    try {
      await setClassColor(actor.uid, cls.id, color);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Popover anchor={open ? anchor : null} onClose={onClose} title={cls ? `${cls.course} color` : "Class color"}>
      {cls && (
        <>
          <div className="grid grid-cols-10 gap-1.5" role="radiogroup" aria-label={`${cls.course} color`}>
            {CLASS_PALETTE.map(({ name, hex }) => {
              const selected = cls.color === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={name}
                  title={name}
                  onClick={() => pick(hex)}
                  className="flex aspect-square w-full items-center justify-center rounded-full text-white outline-offset-2 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-navy-900"
                  style={{ background: hex, boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${hex}` : undefined }}
                >
                  {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
            <span>Only you see this color.</span>
            {hasOwnColor && (
              <button type="button" onClick={() => pick(null)} className="font-semibold text-navy-900 hover:underline">
                Reset to default
              </button>
            )}
          </div>
        </>
      )}
    </Popover>
  );
}
