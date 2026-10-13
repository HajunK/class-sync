"use client";

import clsx from "clsx";
import { Loader2, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type { EventType } from "@/lib/types";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("animate-spin", className ?? "h-5 w-5")} aria-hidden />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-6 w-6 text-navy-900" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={clsx(
          "animate-fade-up relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-[var(--shadow-lift)] sm:rounded-3xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="font-serif text-xl font-semibold text-navy-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-navy-50 hover:text-navy-900" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">{icon}</div>
      <h3 className="font-serif text-lg font-semibold text-navy-900">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TypeBadge({ type }: { type: EventType }) {
  return (
    <span className={clsx("chip", `type-${type}`)} style={{ color: "var(--type)", background: "var(--type-bg)" }}>
      {type}
    </span>
  );
}

const AVATAR_COLORS = ["#071350", "#2357c6", "#0f8a6b", "#c2410c", "#7c3aed", "#be185d", "#b88a00", "#0e7490"];

export function Avatar({ name, size = 28, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  const bg = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white", className)}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
      title={name}
    >
      {initials || "?"}
    </span>
  );
}

export function ClassDot({ color, className }: { color: string; className?: string }) {
  return <span className={clsx("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
