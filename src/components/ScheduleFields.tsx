"use client";

import clsx from "clsx";
import { WEEKDAYS, type ScheduleErrors } from "@/lib/schedule";
import type { ClassSchedule } from "@/lib/types";
import { Field } from "./ui";

/** Day chips plus start and end times: when a class meets. */
export function ScheduleFields({
  value,
  onChange,
  errors,
}: {
  value: ClassSchedule;
  onChange: (next: ClassSchedule) => void;
  /** Shown under the fields; pass null until the person has tried to save. */
  errors: ScheduleErrors | null;
}) {
  const toggle = (d: number) =>
    onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d].sort((a, b) => a - b) });

  return (
    <div className="space-y-3">
      <div>
        <span className="label">Days</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days the class meets">
          {WEEKDAYS.map((name, d) => {
            const on = value.days.includes(d);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(d)}
                className={clsx(
                  "h-9 rounded-full border px-3.5 text-sm font-semibold transition",
                  on ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-navy-900 hover:border-navy-900/30",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
        {errors?.days && <p className="mt-1.5 text-xs text-red-700">{errors.days}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts">
          <input className="input" type="time" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} />
        </Field>
        <Field label="Ends">
          <input className="input" type="time" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} />
        </Field>
      </div>
      {errors?.time && <p className="text-xs text-red-700">{errors.time}</p>}
    </div>
  );
}
