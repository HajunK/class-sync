"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/dates";
import { currentClass, formatLeft } from "@/lib/schedule";
import type { ClassRoom } from "@/lib/types";

/** While the student is in a class's scheduled time, shows how long until it ends. */
export function ClassTimerPill({ classes }: { classes: ClassRoom[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  const current = currentClass(classes, now);
  if (!current) return null;
  const { cls, left } = current;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold whitespace-nowrap text-navy-900"
      title={`${cls.course} ends at ${formatTime(cls.schedule!.end)}`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {formatLeft(left)}
    </span>
  );
}
