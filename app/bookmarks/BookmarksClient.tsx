"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, StickyNote, Trash2, ChevronRight, CalendarDays, Search, X, ChevronsRight, Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bookmark as BookmarkType, Note } from "@/types";
import { nextChapterPosition } from "@/lib/books";
import PlanTab from "./PlanTab";
import StudyTab, { StudyGroup } from "./StudyTab";

function smartDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return isToday
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

interface Props {
  bookmarks: BookmarkType[];
  notes: Pick<Note, "id" | "book_id" | "book_name" | "chapter" | "verse" | "updated_at" | "content">[];
  userId: string;
  userPlans: { id: string; plan_id: string; started_at: string; translation: string; active: boolean }[];
  completions: { plan_id: string; day: number }[];
  studyGroups: StudyGroup[];
}

type Tab = "bookmarks" | "notes" | "plan" | "study";

const NOTE_PAGE_SIZES = [25, 50, 75, 100] as const;
type NotePageSize = typeof NOTE_PAGE_SIZES[number];

export default function BookmarksClient({ bookmarks: initial, notes, userId, userPlans, completions, studyGroups }: Props) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "bookmarks");
  const [bookmarks, setBookmarks] = useState(initial);
  const [noteSearch, setNoteSearch] = useState("");
  const [notePage, setNotePage] = useState(1);
  const [notePageSize, setNotePageSize] = useState<NotePageSize>(25);
  const [exporting, setExporting] = useState(false);

  async function exportData() {
    setExporting(true);
    const [{ data: bm }, { data: nt }, { data: hl }, { data: pr }] = await Promise.all([
      supabase.from("bookmarks").select("book_id,book_name,chapter,verse,translation,label,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("notes").select("book_id,book_name,chapter,verse,content,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("highlights").select("book_id,chapter,verse,translation,color,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("prayers").select("title,content,answered,answered_at,created_at,updated_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), bookmarks: bm ?? [], notes: nt ?? [], highlights: hl ?? [], prayers: pr ?? [] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `psalm1199-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const matchesSearch = (n: Props["notes"][0]) =>
    n.content.toLowerCase().includes(noteSearch.toLowerCase()) ||
    `${n.book_name} ${n.chapter}:${n.verse}`.toLowerCase().includes(noteSearch.toLowerCase());

  const filteredNotes = noteSearch.trim() ? notes.filter(matchesSearch) : notes;
  const paginated = notes.length > 25;
  const totalPages = paginated ? Math.ceil(filteredNotes.length / notePageSize) : 1;
  const visibleNotes = paginated ? filteredNotes.slice((notePage - 1) * notePageSize, notePage * notePageSize) : filteredNotes;

  async function deleteBookmark(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }

  async function advanceBookmark(id: string, bookId: string, chapter: number) {
    const next = nextChapterPosition(bookId, chapter);
    if (!next) return;
    await supabase.from("bookmarks").update({ book_id: next.bookId, book_name: next.bookName, chapter: next.chapter }).eq("id", id);
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, book_id: next.bookId, book_name: next.bookName, chapter: next.chapter, updated_at: new Date().toISOString() } : b));
  }

  const tabs: { key: Tab; label: string; shortLabel?: string; count?: number }[] = [
    { key: "bookmarks", label: "Bookmarks", count: bookmarks.length },
    { key: "notes", label: "Notes", count: notes.length },
    { key: "plan", label: "Reading Plan", shortLabel: "Plan" },
    { key: "study", label: "Study", count: studyGroups.length || undefined },
  ];

  return (
    <div className="max-w-[720px] mx-auto py-10 px-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-light text-ink-primary font-reading">My Reading</h1>
          <button
            onClick={exportData}
            disabled={exporting}
            className="flex items-center gap-1.5 text-[12px] text-ink-muted px-3 py-1.5 rounded-lg border border-line-subtle bg-surface-overlay cursor-pointer disabled:opacity-50 shrink-0 mt-1"
          >
            <Download size={12} />{exporting ? "Exporting…" : "Export"}
          </button>
        </div>
        <p className="text-[13px] text-ink-muted mb-8">
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""} · {notes.length} note{notes.length !== 1 ? "s" : ""} · {userPlans.length} plan{userPlans.length !== 1 ? "s" : ""} · {studyGroups.length} group{studyGroups.length !== 1 ? "s" : ""}
        </p>

        {/* Tabs */}
        <div className="flex gap-0.5 mb-6 border-b border-b-line-subtle overflow-x-auto">
          {tabs.map(({ key, label, shortLabel, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`bg-transparent border-none cursor-pointer px-3 sm:px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap shrink-0 ${
                tab === key ? "text-gold border-b-gold" : "text-ink-muted border-b-transparent"
              }`}
            >
              <span className="sm:hidden">{shortLabel ?? label}</span>
              <span className="hidden sm:inline">{label}</span>
              {count !== undefined && <span className="text-[11px] font-normal ml-1">({count})</span>}
            </button>
          ))}
          <Link
            href="/journal"
            className="no-underline px-3 sm:px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px text-ink-muted border-b-transparent whitespace-nowrap shrink-0"
          >
            <span className="sm:hidden">Prayer</span>
            <span className="hidden sm:inline">Prayer Journal</span>
          </Link>
        </div>

        {/* Bookmarks tab */}
        {tab === "bookmarks" && (
          bookmarks.length === 0 ? (
            <EmptyState icon={<Bookmark size={28} className="text-ink-muted" />} title="No bookmarks yet" message="While reading, tap the Bookmark button to save your place in any chapter." action={{ href: "/bible/GEN/1", label: "Start reading" }} />
          ) : (
            <div className="flex flex-col gap-2">
              {bookmarks.map(bm => <BookmarkCard key={bm.id} bookmark={bm} onDelete={() => deleteBookmark(bm.id)} onAdvance={() => advanceBookmark(bm.id, bm.book_id, bm.chapter)} />)}
            </div>
          )
        )}

        {/* Notes tab */}
        {tab === "notes" && (
          notes.length === 0 ? (
            <EmptyState icon={<StickyNote size={28} className="text-ink-muted" />} title="No notes yet" message="While reading, tap Add note to write thoughts on any chapter." action={{ href: "/bible/PSA/119", label: "Start reading" }} />
          ) : (
            <>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => { setNoteSearch(e.target.value); setNotePage(1); }}
                  placeholder="Search notes…"
                  className="w-full pl-9 pr-8 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-line"
                />
                {noteSearch && (
                  <button onClick={() => setNoteSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted bg-transparent border-none cursor-pointer p-0.5">
                    <X size={14} />
                  </button>
                )}
              </div>

              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-ink-muted text-[13px]">
                  No notes matching &ldquo;{noteSearch}&rdquo;
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {visibleNotes.map(note => <NoteCard key={note.id} note={note} query={noteSearch} />)}
                  </div>

                  {paginated && (
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-line-subtle">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-ink-muted">Per page:</span>
                        {NOTE_PAGE_SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => { setNotePageSize(size); setNotePage(1); }}
                            className={`text-[12px] px-2.5 py-1 rounded-md border cursor-pointer bg-transparent ${
                              notePageSize === size
                                ? "border-gold text-gold"
                                : "border-line-subtle text-ink-muted"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-ink-muted">
                          {(notePage - 1) * notePageSize + 1}–{Math.min(notePage * notePageSize, filteredNotes.length)} of {filteredNotes.length}
                        </span>
                        <button
                          onClick={() => setNotePage(p => Math.max(1, p - 1))}
                          disabled={notePage === 1}
                          className="text-[12px] px-2.5 py-1 rounded-md border border-line-subtle text-ink-muted cursor-pointer bg-transparent disabled:opacity-30"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setNotePage(p => Math.min(totalPages, p + 1))}
                          disabled={notePage === totalPages}
                          className="text-[12px] px-2.5 py-1 rounded-md border border-line-subtle text-ink-muted cursor-pointer bg-transparent disabled:opacity-30"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
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

        {/* Study tab */}
        {tab === "study" && (
          <StudyTab initialGroups={studyGroups} userId={userId} />
        )}
    </div>
  );
}

function BookmarkCard({ bookmark, onDelete, onAdvance }: { bookmark: BookmarkType; onDelete: () => void; onAdvance: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const next = nextChapterPosition(bookmark.book_id, bookmark.chapter);
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
            <span className="ml-2" suppressHydrationWarning>{smartDate(bookmark.updated_at)}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {next && (
          <button
            onClick={onAdvance}
            title={`Advance to ${next.bookName} ${next.chapter}`}
            className="flex items-center gap-1 text-xs text-ink-secondary px-[10px] py-1.5 bg-surface-overlay rounded-md border border-line-subtle cursor-pointer"
          >
            <ChevronsRight size={12} /><span className="hidden sm:inline"> {next.label}</span>
          </button>
        )}
        <Link href={`/bible/${bookmark.book_id}/${bookmark.chapter}?t=${bookmark.translation}`} className="flex items-center gap-1 text-xs text-ink-secondary no-underline px-[10px] py-1.5 bg-surface-overlay rounded-md border border-line-subtle">
          <span className="hidden sm:inline">Open </span><ChevronRight size={12} />
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

function noteSnippet(content: string, query: string): string {
  if (!query.trim()) return content.length > 200 ? content.slice(0, 200) + "…" : content;
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return content.length > 200 ? content.slice(0, 200) + "…" : content;
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + query.length + 120);
  return (start > 0 ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-gold/30 text-ink-primary not-italic rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function NoteCard({ note, query = "" }: { note: Props["notes"][0]; query?: string }) {
  const snippet = noteSnippet(note.content, query);
  return (
    <Link href={`/bible/${note.book_id}/${note.chapter}?note=1#v${note.verse}`} className="no-underline block border rounded-[10px] px-4 py-[14px] bg-surface-raised border-line-subtle">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-semibold text-ink-primary m-0">{note.book_name} {note.chapter}:{note.verse}</p>
        <span className="text-[11px] text-ink-muted shrink-0" suppressHydrationWarning>{smartDate(note.updated_at)}</span>
      </div>
      <p className="text-[13px] text-ink-secondary m-0 leading-[1.6] italic">
        &quot;<HighlightedText text={snippet} query={query} />&quot;
      </p>
      <p className="text-[11px] text-ink-muted mt-2 mb-0 flex items-center gap-1">
        Click to open <ChevronRight size={10} />
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
