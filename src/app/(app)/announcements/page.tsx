"use client";

import { Megaphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, EmptyState, Field, PageLoader, Spinner } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { addAnnouncement, ANNOUNCEMENT_LIMITS, deleteAnnouncement, useAnnouncements } from "@/lib/db";
import { timeAgo, tsToDate } from "@/lib/dates";

export default function AnnouncementsPage() {
  const { actor } = useWorkspace();
  const { data: announcements, loading } = useAnnouncements();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await addAnnouncement(actor, { title, description });
      setTitle("");
      setDescription("");
      toast.success("Announcement posted. Everyone can see it now.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-navy-900">Announcements</h1>
        <p className="text-sm text-muted">Posted announcements stay at the bottom of every tab until their author deletes them.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <form onSubmit={submit} className="card h-fit space-y-4 p-5">
          <Field label="Announcement Title">
            <input
              className="input"
              required
              maxLength={ANNOUNCEMENT_LIMITS.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quiz moved to Friday"
            />
          </Field>
          <Field label="Announcement Description">
            <textarea
              className="input min-h-[120px]"
              required
              maxLength={ANNOUNCEMENT_LIMITS.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does everyone need to know?"
            />
          </Field>
          <button className="btn btn-primary min-w-28" disabled={busy || !title.trim() || !description.trim()}>
            {busy ? <Spinner className="h-4 w-4" /> : "Post announcement"}
          </button>
        </form>

        <div className="space-y-3">
          {loading ? (
            <PageLoader />
          ) : announcements.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements yet" body="Post one and it will appear for everyone, on every tab." />
          ) : (
            announcements.map((a) => (
              <article key={a.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={a.authorName} size={32} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold break-words text-navy-900">{a.title}</h2>
                    <p className="text-xs text-muted">
                      {a.authorName} · {timeAgo(tsToDate(a.createdAt))}
                    </p>
                    <p className="mt-2 text-sm whitespace-pre-wrap break-words text-ink">{a.description}</p>
                  </div>
                  {a.authorId === actor.uid && (
                    <button
                      onClick={() => remove(a.id)}
                      className="rounded-full p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete announcement: ${a.title}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
