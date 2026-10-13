"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { Bold, Camera, Heading1, Heading2, Italic, List, ListOrdered, Loader2, Quote, Redo2, Strikethrough, Underline, Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { postWithAuth } from "@/lib/api";
import { photoToDataUrl } from "@/lib/image";

/**
 * Plain-text version of the document for the AI merge: keeps headings and
 * list structure ("# Heading", "- item", "1. item").
 */
export function toPlainText(doc: JSONContent): string {
  const inline = (n: JSONContent): string =>
    n.type === "text" ? n.text || "" : n.type === "hardBreak" ? "\n" : (n.content || []).map(inline).join("");

  const block = (n: JSONContent, prefix = ""): string[] => {
    switch (n.type) {
      case "heading":
        return [`${"#".repeat(n.attrs?.level || 1)} ${inline(n)}`];
      case "paragraph":
        return [prefix + inline(n)];
      case "bulletList":
        return (n.content || []).flatMap((li) => item(li, `${prefix}- `, prefix));
      case "orderedList":
        return (n.content || []).flatMap((li, i) => item(li, `${prefix}${i + 1}. `, prefix));
      case "blockquote":
        return (n.content || []).flatMap((c) => block(c, `${prefix}> `));
      case "codeBlock":
        return [inline(n)];
      default:
        return (n.content || []).flatMap((c) => block(c, prefix));
    }
  };
  const item = (li: JSONContent, marker: string, indent: string) =>
    (li.content || []).flatMap((c, i) => (i === 0 && c.type === "paragraph" ? [marker + inline(c)] : block(c, indent + "  ")));

  return block(doc)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Turn transcribed plain text ("# Heading", "- item") into editor HTML. */
function textToHtml(text: string) {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const out: string[] = [];
  let list: string[] | null = null;
  const close = () => {
    if (list) out.push(`<ul>${list.join("")}</ul>`);
    list = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      close();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (bullet) {
      (list ||= []).push(`<li><p>${esc(bullet[1])}</p></li>`);
      continue;
    }
    close();
    out.push(heading ? `<h2>${esc(heading[1])}</h2>` : `<p>${esc(line)}</p>`);
  }
  close();
  return out.join("");
}

export function NoteEditor({
  content,
  editable = true,
  onChange,
}: {
  content: string;
  editable?: boolean;
  onChange?: (html: string, text: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing your notes for this lesson…" })],
    content,
    editable,
    immediatelyRender: false,
    editorProps: { attributes: { class: "doc focus:outline-none" } },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML(), toPlainText(editor.getJSON())),
  });

  return (
    <div>
      {editable && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(0);

  // Photographed handwriting → text, inserted where the cursor is.
  async function readPhotos(files: File[]) {
    for (const file of files) {
      setReading((n) => n + 1);
      try {
        const image = await photoToDataUrl(file);
        const { text } = await postWithAuth<{ text: string }>("/api/transcribe-note", { image });
        if (!text) toast.warning(`No notes found in “${file.name}”.`);
        else {
          editor.chain().focus().insertContent(textToHtml(text)).run();
          toast.success("Photo converted to text. Check it and fix anything misread.");
        }
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setReading((n) => n - 1);
      }
    }
  }

  const buttons = [
    { icon: Undo2, label: "Undo", run: () => c().undo().run(), disabled: !s.canUndo },
    { icon: Redo2, label: "Redo", run: () => c().redo().run(), disabled: !s.canRedo },
    "|",
    { icon: Heading1, label: "Heading", run: () => c().toggleHeading({ level: 1 }).run(), active: s.h1 },
    { icon: Heading2, label: "Subheading", run: () => c().toggleHeading({ level: 2 }).run(), active: s.h2 },
    "|",
    { icon: Bold, label: "Bold", run: () => c().toggleBold().run(), active: s.bold },
    { icon: Italic, label: "Italic", run: () => c().toggleItalic().run(), active: s.italic },
    { icon: Underline, label: "Underline", run: () => c().toggleUnderline().run(), active: s.underline },
    { icon: Strikethrough, label: "Strikethrough", run: () => c().toggleStrike().run(), active: s.strike },
    "|",
    { icon: List, label: "Bulleted list", run: () => c().toggleBulletList().run(), active: s.bullet },
    { icon: ListOrdered, label: "Numbered list", run: () => c().toggleOrderedList().run(), active: s.ordered },
    { icon: Quote, label: "Quote", run: () => c().toggleBlockquote().run(), active: s.quote },
  ] as const;

  return (
    <div className="sticky top-[136px] z-10 flex flex-wrap items-center gap-0.5 rounded-full border border-line bg-white px-2 py-1 shadow-sm">
      {buttons.map((b, i) =>
        b === "|" ? (
          <span key={i} className="mx-1 h-5 w-px bg-line" />
        ) : (
          <button
            key={b.label}
            type="button"
            title={b.label}
            aria-label={b.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={b.run}
            disabled={"disabled" in b ? b.disabled : false}
            className={clsx(
              "rounded-md p-1.5 transition disabled:opacity-30",
              "active" in b && b.active ? "bg-navy-100 text-navy-900" : "text-ink/70 hover:bg-paper",
            )}
          >
            <b.icon className="h-4 w-4" />
          </button>
        ),
      )}
      <span className="mx-1 h-5 w-px bg-line" />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        disabled={reading > 0}
        title="Add a photo of handwritten notes — it's converted to text"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-paper disabled:opacity-60"
      >
        {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {reading ? "Reading photo…" : "Photo to text"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          readPhotos(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
