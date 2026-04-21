"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, StickyNote, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { Book, Translation, Chapter, Bookmark as BookmarkType, Note } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface ChapterViewProps {
  book: Book;
  chapter: number;
  translation: Translation;
  chapterData: Chapter | null;
  user: { id: string; email?: string } | null;
  initialBookmark: BookmarkType | null;
  initialNote: Note | null;
}

export default function ChapterView({
  book,
  chapter,
  translation,
  chapterData,
  user,
  initialBookmark,
  initialNote,
}: ChapterViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [bookmark, setBookmark] = useState<BookmarkType | null>(initialBookmark);
  const [note, setNote] = useState<Note | null>(initialNote);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState(initialNote?.content ?? "");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState(initialBookmark?.label ?? "");
  const [labelEditing, setLabelEditing] = useState(false);

  // ── Bookmark toggle ──
  async function toggleBookmark() {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (bookmark) {
      // Remove
      await supabase.from("bookmarks").delete().eq("id", bookmark.id);
      setBookmark(null);
      setBookmarkLabel("");
    } else {
      // Add
      const { data } = await supabase
        .from("bookmarks")
        .insert({
          user_id: user.id,
          book_id: book.id,
          book_name: book.name,
          chapter,
          translation,
          label: "",
        })
        .select()
        .single();
      setBookmark(data);
      setLabelEditing(true);
    }
  }

  // ── Save bookmark label ──
  async function saveLabel() {
    if (!bookmark) return;
    await supabase
      .from("bookmarks")
      .update({ label: bookmarkLabel })
      .eq("id", bookmark.id);
    setLabelEditing(false);
    setBookmark({ ...bookmark, label: bookmarkLabel });
  }

  // ── Save note ──
  async function saveNote() {
    if (!user) return;
    setNoteSaving(true);

    if (note) {
      const { data } = await supabase
        .from("notes")
        .update({ content: noteContent })
        .eq("id", note.id)
        .select()
        .single();
      setNote(data);
    } else {
      const { data } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          book_id: book.id,
          book_name: book.name,
          chapter,
          translation,
          content: noteContent,
        })
        .select()
        .single();
      setNote(data);
    }

    setNoteSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  // ── Error state ──
  if (!chapterData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary px-6 py-20">
        <AlertCircle className="w-8 h-8 text-text-muted" />
        <div className="text-center">
          <p className="font-medium mb-1">Couldn't load this chapter</p>
          <p className="text-sm text-text-muted">
            Check that your <code className="text-gold">BIBLE_API_KEY</code> is set in{" "}
            <code className="text-gold">.env.local</code>
          </p>
        </div>
        <a
          href="https://scripture.api.bible"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold hover:underline"
        >
          Get a free API key →
        </a>
      </div>
    );
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  return (
    <div className="flex h-full">
      {/* ── Reading pane ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Chapter heading */}
          <div className="mb-8 animate-fade-in">
            <h2
              className="text-2xl font-light mb-1"
              style={{ fontFamily: "var(--font-reading)", color: "var(--text-primary)" }}
            >
              {book.name}
            </h2>
            <p className="text-text-muted text-sm">
              Chapter {chapter} · {translation}
            </p>
            <div className="gold-divider mt-4" />
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              title={bookmark ? "Remove bookmark" : "Bookmark this chapter"}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                bookmark
                  ? "bg-gold/10 border-gold-muted text-gold"
                  : "bg-surface-raised border-border-subtle text-text-secondary hover:border-gold hover:text-gold"
              )}
            >
              {bookmark ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              {bookmark ? "Bookmarked" : "Bookmark"}
            </button>

            {/* Bookmark label inline editor */}
            {bookmark && labelEditing && (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={bookmarkLabel}
                  onChange={(e) => setBookmarkLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                  placeholder='Label (e.g. "Morning reading")'
                  className="text-xs px-2 py-1.5 bg-surface-overlay border border-border rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold w-44"
                />
                <button
                  onClick={saveLabel}
                  className="text-xs text-gold hover:underline"
                >
                  Save
                </button>
              </div>
            )}

            {bookmark && !labelEditing && bookmark.label && (
              <button
                onClick={() => setLabelEditing(true)}
                className="text-xs text-text-muted hover:text-text-secondary italic"
              >
                "{bookmark.label}"
              </button>
            )}

            {/* Notes button */}
            <button
              onClick={() => {
                if (!user) { router.push("/auth/login"); return; }
                setNoteOpen((o) => !o);
              }}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                note
                  ? "bg-surface-overlay border-border text-text-secondary"
                  : "bg-surface-raised border-border-subtle text-text-secondary hover:border-border hover:text-text-primary",
                noteOpen && "border-border text-text-primary"
              )}
            >
              <StickyNote className="w-3.5 h-3.5" />
              {note ? "View note" : "Add note"}
            </button>
          </div>

          {/* Bible text */}
          <div className="bible-text animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {chapterData.verses.map((verse) => (
              <span key={verse.number}>
                <sup className="verse-number">{verse.number}</sup>
                {verse.text}{" "}
              </span>
            ))}
          </div>

          {/* Bottom chapter navigation */}
          <div className="flex justify-between items-center mt-16 pt-6 border-t border-border-subtle">
            {prevChapter ? (
              <a
                href={`/bible/${book.id}/${prevChapter}?t=${translation}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-gold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Chapter {prevChapter}
              </a>
            ) : <span />}

            {nextChapter ? (
              <a
                href={`/bible/${book.id}/${nextChapter}?t=${translation}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-gold transition-colors"
              >
                Chapter {nextChapter}
                <ChevronRight className="w-4 h-4" />
              </a>
            ) : <span />}
          </div>
        </div>
      </div>

      {/* ── Notes panel ── */}
      {noteOpen && (
        <div className="w-80 border-l border-border-subtle bg-surface-raised flex flex-col shrink-0 animate-fade-in">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              Notes — {book.name} {chapter}
            </h3>
            <button
              onClick={() => setNoteOpen(false)}
              className="text-text-muted hover:text-text-secondary text-lg leading-none"
            >
              ×
            </button>
          </div>

          <textarea
            className="flex-1 bg-transparent text-text-primary text-sm p-4 resize-none focus:outline-none placeholder-text-muted leading-relaxed"
            placeholder={`Write your notes for ${book.name} ${chapter}…`}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />

          <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between">
            {note?.updated_at && (
              <span className="text-xs text-text-muted">
                Saved {new Date(note.updated_at).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={saveNote}
              disabled={noteSaving}
              className="ml-auto px-3 py-1.5 bg-gold text-surface text-xs font-semibold rounded hover:bg-gold-bright transition-colors disabled:opacity-50"
            >
              {noteSaving ? "Saving…" : noteSaved ? "Saved ✓" : "Save note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
