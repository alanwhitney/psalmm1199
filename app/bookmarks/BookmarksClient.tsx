"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Bookmark, StickyNote, Trash2, LogOut, ChevronRight, ArrowLeft, CalendarDays } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bookmark as BookmarkType, Note } from "@/types";
import PlanTab from "./PlanTab";

interface Props {
  bookmarks: BookmarkType[];
  notes: Pick<Note, "id" | "book_id" | "book_name" | "chapter" | "translation" | "updated_at" | "content">[];
  userEmail: string;
  userId: string;
  userPlans: { id: string; plan_id: string; started_at: string; translation: string; active: boolean }[];
  completions: { plan_id: string; day: number }[];
  backHref: string;
}

type Tab = "bookmarks" | "notes" | "plan";

export default function BookmarksClient({ bookmarks: initial, notes, userEmail, userId, userPlans, completions, backHref }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "bookmarks");
  const [bookmarks, setBookmarks] = useState(initial);

  async function deleteBookmark(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "bookmarks", label: "Bookmarks", count: bookmarks.length },
    { key: "notes", label: "Notes", count: notes.length },
    { key: "plan", label: "Reading Plan" },
  ];

  return (
    <div className="min-h-screen bg-surface text-ink-primary">
      {/* Header */}
      <header className="bg-surface-raised border-b border-b-line-subtle px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="flex items-center gap-1.5 no-underline text-ink-muted text-[13px]">
            <ArrowLeft size={15} /> Back to reading
          </Link>
          <div className="w-px h-4 bg-line-subtle" />
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-gold" />
            <span className="text-[13px] font-semibold text-ink-primary">Psalm 119:9</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-muted">{userEmail}</span>
          <button onClick={handleSignOut} className="bg-transparent border-none cursor-pointer text-ink-muted flex items-center gap-1.5 text-xs p-0">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto py-10 px-6">
        <h1 className="text-2xl font-light text-ink-primary mb-2 font-reading">
          My Reading
        </h1>
        <p className="text-[13px] text-ink-muted mb-8">
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""} · {notes.length} note{notes.length !== 1 ? "s" : ""} · {userPlans.length} plan{userPlans.length !== 1 ? "s" : ""}
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-b-line-subtle">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`bg-transparent border-none cursor-pointer px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px ${
                tab === key ? "text-gold border-b-gold" : "text-ink-muted border-b-transparent"
              }`}
            >
              {label}{count !== undefined && <span className="text-[11px] font-normal ml-1">({count})</span>}
            </button>
          ))}
        </div>

        {/* Bookmarks tab */}
        {tab === "bookmarks" && (
          bookmarks.length === 0 ? (
            <EmptyState icon={<Bookmark size={28} className="text-ink-muted" />} title="No bookmarks yet" message="While reading, tap the Bookmark button to save your place in any chapter." action={{ href: "/bible/GEN/1", label: "Start reading" }} />
          ) : (
            <div className="flex flex-col gap-2">
              {bookmarks.map(bm => <BookmarkCard key={bm.id} bookmark={bm} onDelete={() => deleteBookmark(bm.id)} />)}
            </div>
          )
        )}

        {/* Notes tab */}
        {tab === "notes" && (
          notes.length === 0 ? (
            <EmptyState icon={<StickyNote size={28} className="text-ink-muted" />} title="No notes yet" message="While reading, tap Add note to write thoughts on any chapter." action={{ href: "/bible/PSA/119", label: "Start reading" }} />
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map(note => <NoteCard key={note.id} note={note} />)}
            </div>
          )
        )}

        {/* Plan tab */}
        {tab === "plan" && (
          <PlanTab
            userId={userId}
            initialPlans={userPlans}
            initialCompletions={completions}
            defaultTranslation="KJV"
          />
        )}
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark, onDelete }: { bookmark: BookmarkType; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="bg-surface-raised border border-line-subtle rounded-[10px] px-4 py-[14px] flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gold/[8%] border border-gold-muted flex items-center justify-center shrink-0">
          <Bookmark size={14} className="text-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-primary mb-0.5">
            {bookmark.book_name} {bookmark.chapter}
            {bookmark.verse && <span className="text-ink-muted font-normal">:{bookmark.verse}</span>}
          </p>
          <p className="text-[11px] text-ink-muted m-0">
            {bookmark.translation}
            {bookmark.label && <span className="text-ink-secondary"> · &quot;{bookmark.label}&quot;</span>}
            <span className="ml-2">{new Date(bookmark.created_at).toLocaleDateString()}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/bible/${bookmark.book_id}/${bookmark.chapter}?t=${bookmark.translation}`} className="flex items-center gap-1 text-xs text-ink-secondary no-underline px-[10px] py-1.5 bg-surface-overlay rounded-md border border-line-subtle">
          Open <ChevronRight size={12} />
        </Link>
        {confirming ? (
          <div className="flex gap-1.5">
            <button onClick={onDelete} className="text-[11px] px-[10px] py-[5px] bg-red-500/[8%] border border-red-500/25 rounded-md text-red-400 cursor-pointer">Remove</button>
            <button onClick={() => setConfirming(false)} className="text-[11px] px-[10px] py-[5px] bg-surface-overlay border border-line-subtle rounded-md text-ink-muted cursor-pointer">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1.5 flex">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: Props["notes"][0] }) {
  const preview = note.content.length > 120 ? note.content.slice(0, 120) + "…" : note.content;
  return (
    <Link href={`/bible/${note.book_id}/${note.chapter}?t=${note.translation}&note=1`} className="no-underline block bg-surface-raised border border-line-subtle rounded-[10px] px-4 py-[14px]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-semibold text-ink-primary m-0">{note.book_name} {note.chapter}</p>
        <span className="text-[11px] text-ink-muted shrink-0">{new Date(note.updated_at).toLocaleDateString()}</span>
      </div>
      <p className="text-[13px] text-ink-secondary m-0 leading-[1.6] italic">&quot;{preview}&quot;</p>
      <p className="text-[11px] text-ink-muted mt-2 mb-0 flex items-center gap-1">
        {note.translation} · Click to open <ChevronRight size={10} />
      </p>
    </Link>
  );
}

function EmptyState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action: { href: string; label: string } }) {
  return (
    <div className="text-center py-[60px] px-6">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-ink-primary mb-2">{title}</h3>
      <p className="text-[13px] text-ink-muted max-w-[320px] mx-auto mb-5 leading-[1.6]">{message}</p>
      <Link href={action.href} className="text-[13px] text-gold no-underline px-4 py-2 border border-gold-muted rounded-lg">
        {action.label} →
      </Link>
    </div>
  );
}
