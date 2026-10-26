"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import type { MergedNote } from "@/lib/types";

// Notes already fetched this visit, so coming back to the list shows them at once while a fresh copy loads.
const seen = new Map<string, string>();

/** Strips the active parts from note HTML (it's only ever your own note, but it's still markup). Links become plain text, since the card is itself a link. */
function safeHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script,style,iframe,object,embed,link,meta,form,input,button,svg,math,img,video,audio").forEach((n) => n.remove());
  parsed.querySelectorAll("a").forEach((a) => a.replaceWith(...Array.from(a.childNodes)));
  parsed.body.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) if (attr.name.toLowerCase().startsWith("on")) el.removeAttribute(attr.name);
  });
  return parsed.body.innerHTML;
}

/**
 * A miniature of the note's first page, like a document preview: your own note if you wrote one,
 * else the class note, else a blank page. The page is laid out at full size, then shrunk to fit.
 */
export function NoteThumbnail({
  classId,
  sessionId,
  uid,
  wrote,
  merged,
}: {
  classId: string;
  sessionId: string;
  uid: string;
  /** Whether you've written a note for this lesson (so there's one to fetch). */
  wrote: boolean;
  merged?: MergedNote | null;
}) {
  const key = `${classId}/${sessionId}/${uid}`;
  const [html, setHtml] = useState(() => seen.get(key) ?? "");

  useEffect(() => {
    if (!wrote) return;
    let alive = true;
    getDoc(doc(db, "classes", classId, "sessions", sessionId, "notes", uid))
      .then((snap) => {
        const fresh = snap.exists() ? String(snap.data().html || "") : "";
        seen.set(key, fresh);
        if (alive) setHtml(fresh);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [wrote, classId, sessionId, uid, key]);

  const own = useMemo(() => (wrote && html.replace(/<[^>]*>/g, "").trim() ? safeHtml(html) : ""), [wrote, html]);

  return (
    <div className="relative aspect-[5/6] overflow-hidden border-b border-line bg-white" aria-hidden>
      {/* 250% wide at 40% size fits the card exactly, whatever its width. */}
      <div className="pointer-events-none absolute top-0 left-0 w-[250%] origin-top-left scale-[0.4] select-none">
        {own ? (
          <div className="doc !min-h-0 !px-8 !py-8" dangerouslySetInnerHTML={{ __html: own }} />
        ) : merged ? (
          <div className="doc !min-h-0 !px-8 !py-8">
            <h1>{merged.title}</h1>
            <p>{merged.overview}</p>
            {merged.sections.slice(0, 3).map((section, i) => (
              <div key={i}>
                <h2>{section.heading}</h2>
                <ul>
                  {section.items.slice(0, 4).map((item, j) => (
                    <li key={j}>{item.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5 px-10 py-10">
            {[60, 100, 92, 100, 70, 0, 84, 100, 56].map((w, i) => (w ? <div key={i} className="h-3 rounded bg-navy-50" style={{ width: `${w}%` }} /> : <div key={i} className="h-3" />))}
          </div>
        )}
      </div>
    </div>
  );
}
