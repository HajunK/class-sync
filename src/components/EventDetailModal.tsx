"use client";

import { format } from "date-fns";
import { CheckCircle2, CircleDashed, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isVerified, setConfirmation, useEventHistory, VERIFY_THRESHOLD, type Actor } from "@/lib/db";
import { formatTime, fromKey, timeAgo, tsToDate } from "@/lib/dates";
import type { ClassEvent, ClassRoom, EventHistory } from "@/lib/types";
import { Modal, TypeBadge } from "./ui";

interface Props {
  event: ClassEvent | null;
  cls?: ClassRoom;
  actor: Actor;
  onClose: () => void;
  onEdit: (e: ClassEvent) => void;
}

export function EventDetailModal({ event, ...rest }: Props) {
  return (
    <Modal open={!!event} onClose={rest.onClose} title={event?.title ?? ""}>
      {event && <Body event={event} {...rest} />}
    </Modal>
  );
}

const FIELD: Record<string, string> = { type: "type", title: "title", date: "date", time: "time", details: "details" };

function describe(h: EventHistory) {
  if (h.action === "created") return "added this entry";
  if (h.action === "confirmed") return "confirmed it";
  if (h.action === "unconfirmed") return "removed their confirmation";
  const parts = Object.entries(h.changes || {}).map(([k, v]) => `${FIELD[k] ?? k}: “${v.from || "—"}” → “${v.to || "—"}”`);
  return `changed ${parts.join(", ")}`;
}

function Body({ event, cls, actor, onEdit }: Omit<Props, "event"> & { event: ClassEvent }) {
  const history = useEventHistory(event.classId, event.id);
  const [busy, setBusy] = useState(false);
  const verified = isVerified(event);
  const confirmed = event.confirmations.includes(actor.uid);
  const isAuthor = event.createdBy === actor.uid;

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <TypeBadge type={event.type} />
          <span className="text-muted">{cls ? `${cls.course} · ${cls.section}` : ""}</span>
        </div>
        <p className="pt-1 text-base font-semibold text-navy-900">
          {format(fromKey(event.date), "EEEE, MMMM d")}
          {event.time && ` · ${formatTime(event.time)}`}
        </p>
        {event.details && <p className="whitespace-pre-wrap text-ink/80">{event.details}</p>}
      </div>

      <div className="rounded-xl bg-paper p-4">
        <p className={verified ? "flex items-center gap-1.5 font-semibold text-emerald-700" : "flex items-center gap-1.5 font-semibold text-amber-700"}>
          {verified ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
          {verified
            ? `Verified — confirmed by ${event.confirmations.length} classmates`
            : `Unverified — ${event.confirmations.length} of ${VERIFY_THRESHOLD} confirmations`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!isAuthor && (
            <button
              className={confirmed ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await setConfirmation(actor, event, !confirmed).catch((e) => toast.error(e.message));
                setBusy(false);
              }}
            >
              {confirmed ? "Undo confirm" : "Confirm — I heard this too"}
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => onEdit(event)}>
            <Pencil className="h-3.5 w-3.5" /> Correct
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Edit history</p>
        <ul className="space-y-1.5 text-sm">
          {history.map((h) => (
            <li key={h.id} className="text-ink/80">
              <span className="font-semibold text-navy-900">{h.by === actor.uid ? "You" : h.byName}</span> {describe(h)}
              <span className="ml-1.5 text-xs text-muted">{timeAgo(tsToDate(h.at))}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
