import clsx from "clsx";

export function Crest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={clsx("shrink-0", className ?? "h-9 w-8")} aria-hidden>
      <path d="M20 1.5 37.5 7v16.5c0 10.6-7.3 17.9-17.5 21-10.2-3.1-17.5-10.4-17.5-21V7L20 1.5Z" className="fill-navy-900 stroke-white" strokeWidth="2.2" />
      <path d="M11 15.5h18M11 21h18M11 26.5h11" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="27.5" cy="27.5" r="4.2" fill="#ffffff" />
      <path d="m25.7 27.6 1.3 1.3 2.4-2.6" className="stroke-navy-900" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <Crest />
      <span className={clsx("font-heading text-[28px] leading-none font-extrabold tracking-tight", light ? "text-white" : "text-navy-900")}>
        ClassSync
      </span>
    </span>
  );
}
