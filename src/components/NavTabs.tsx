"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** The tabs. One light pill sits behind the active tab and glides to the next one, passing behind its text. */
export function NavTabs({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  // Off for the first placement so the pill doesn't slide in from the corner on load.
  const [glide, setGlide] = useState(false);
  const active = items.find((i) => pathname.startsWith(i.href))?.href;

  const measure = useCallback(() => {
    const el = active ? linkRefs.current[active] : null;
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [active]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setGlide(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Labels hide on small screens and fonts load late, either of which moves the tabs.
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (navRef.current) ro.observe(navRef.current);
    Object.values(linkRefs.current).forEach((l) => l && ro.observe(l));
    return () => ro.disconnect();
  }, [measure, items]);

  return (
    <nav ref={navRef} className="relative ml-2 flex items-center gap-1">
      <span
        aria-hidden
        className={clsx("absolute inset-y-0 left-0 rounded-full bg-white/10", glide && "transition-[transform,width] duration-300 ease-[cubic-bezier(0.3,0.8,0.2,1)]")}
        style={{ width: pill?.width ?? 0, transform: `translateX(${pill?.left ?? 0}px)`, opacity: pill ? 1 : 0 }}
      />
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === active;
        return (
          <Link
            key={href}
            href={href}
            ref={(el) => {
              linkRefs.current[href] = el;
            }}
            className={clsx(
              "relative z-10 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4",
              isActive ? "text-white" : "text-white/65 hover:text-white",
            )}
          >
            <Icon className={clsx("h-4 w-4", isActive && "text-gold-500")} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
