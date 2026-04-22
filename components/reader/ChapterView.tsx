"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, StickyNote, ChevronRight, ChevronLeft, AlertCircle, Trash2 } from "lucide-react";
import { Book, Translation, Chapter, Bookmark as BookmarkType, Note } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  bgOverlay: "#222228",
  border: "#2a2a32",
  borderDefault: "#3a3a46",
  gold: "#c9a84c",
  goldMuted: "#8a6e2f",
  goldBright: "#e8c56a",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

interface ChapterViewProps {
  book: Book;
  chapter: number;
  translation: Translation;
  chapterData: Chapter | null;
  user: { id: string; email?: string } | null;
  initialBookmark: BookmarkType | null;
  initialNote: Note | null;
}

export default function ChapterView({ book, chapter, translation, chapterData, user, initialBookmark, initialNote }: ChapterViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [bookmark, setBookmark] = useState<BookmarkType | null>(initialBookmark);
  const [note, setNote] = useState<Note | null>(initialNote);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState(initialNote?.content ?? "");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState(initialBookmark?.label ?? "");
  const [labelEditing, setLabelEditing] = useState(false);

  async function toggleBookmark() {
    if (!user) { router.push("/auth/login"); return; }
    if (bookmark) {
      await supabase.from("bookmarks").delete().eq("id", bookmark.id);
      setBookmark(null);
      setBookmarkLabel("");
    } else {
      const { data } = await supabase.from("bookmarks").insert({
        user_id: user.id, book_id: book.id, book_name: book.name,
        chapter, translation, label: "",
      }).select().single();
      setBookmark(data);
      setLabelEditing(true);
    }
  }

  async function saveLabel() {
    if (!bookmark) return;
    await supabase.from("bookmarks").update({ label: bookmarkLabel }).eq("id", bookmark.id);
    setLabelEditing(false);
    setBookmark({ ...bookmark, label: bookmarkLabel });
  }

  async function saveNote() {
    if (!user) return;
    setNoteSaving(true);
    if (note) {
      const { data } = await supabase.from("notes").update({ content: noteContent }).eq("id", note.id).select().single();
      setNote(data);
    } else {
      const { data } = await supabase.from("notes").insert({
        user_id: user.id, book_id: book.id, book_name: book.name,
        chapter, translation, content: noteContent,
      }).select().single();
      setNote(data);
    }
    setNoteSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  async function deleteNote() {
    if (!note) return;
    await supabase.from("notes").delete().eq("id", note.id);
    setNote(null);
    setNoteContent("");
    setNoteOpen(false);
  }

  if (!chapterData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, padding: "80px 24px", color: C.textSecondary }}>
        <AlertCircle size={32} color={C.textMuted} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 600, marginBottom: 4, color: C.textPrimary }}>Couldn't load this chapter</p>
          <p style={{ fontSize: 13, color: C.textMuted }}>
            Check that your <code style={{ color: C.gold }}>BIBLE_API_KEY</code> is set in <code style={{ color: C.gold }}>.env.local</code>
          </p>
        </div>
        <a href="https://scripture.api.bible" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.gold }}>
          Get a free API key →
        </a>
      </div>
    );
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Reading pane */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px" }}>

          {/* Chapter heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 300, marginBottom: 4, color: C.textPrimary, fontFamily: "var(--font-reading, Georgia, serif)" }}>
              {book.name}
            </h2>
            <p style={{ fontSize: 12, color: C.textMuted }}>Chapter {chapter} · {translation}</p>
            <div style={{ height: 1, marginTop: 16, background: `linear-gradient(to right, transparent, ${C.goldMuted}, transparent)` }} />
          </div>

          {/* Action bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${bookmark ? C.goldMuted : C.border}`,
                background: bookmark ? `${C.gold}18` : C.bgRaised,
                color: bookmark ? C.gold : C.textSecondary,
              }}
            >
              {bookmark ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {bookmark ? "Bookmarked" : "Bookmark"}
            </button>

            {/* Label editor */}
            {bookmark && labelEditing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  autoFocus
                  value={bookmarkLabel}
                  onChange={(e) => setBookmarkLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                  placeholder='Label (e.g. "Morning reading")'
                  style={{ fontSize: 12, padding: "5px 10px", background: C.bgOverlay, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textPrimary, outline: "none", width: 180 }}
                />
                <button onClick={saveLabel} style={{ fontSize: 12, color: C.gold, background: "none", border: "none", cursor: "pointer" }}>Save</button>
              </div>
            )}
            {bookmark && !labelEditing && bookmark.label && (
              <button onClick={() => setLabelEditing(true)} style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", background: "none", border: "none", cursor: "pointer" }}>
                "{bookmark.label}"
              </button>
            )}

            {/* Notes button */}
            <button
              onClick={() => { if (!user) { router.push("/auth/login"); return; } setNoteOpen(o => !o); }}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${noteOpen ? C.borderDefault : C.border}`,
                background: noteOpen ? C.bgOverlay : C.bgRaised,
                color: note ? C.textPrimary : C.textSecondary,
              }}
            >
              <StickyNote size={13} />
              {note ? "View note" : "Add note"}
            </button>
          </div>

          {/* Bible text */}
          <div style={{ fontFamily: "var(--font-reading, Georgia, serif)", fontSize: 17, lineHeight: 2, color: C.textPrimary }}>
            {chapterData.verses.map((verse) => {
              // Split on \n to render poetic line breaks
              const lines = verse.text.split("\n");
              return (
                <p key={verse.number} style={{ margin: "0 0 16px" }}>
                  <sup style={{ fontSize: 10, fontWeight: 700, color: C.goldMuted, marginRight: 3, fontFamily: "ui-sans-serif, system-ui", verticalAlign: "super", userSelect: "none" }}>
                    {verse.number}
                  </sup>
                  {lines.map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {i > 0 && <span style={{ display: "inline-block", width: 24 }} />}
                      {line.trim()}
                    </span>
                  ))}
                </p>
              );
            })}
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 64, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
            {prevChapter ? (
              <a href={`/bible/${book.id}/${prevChapter}?t=${translation}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSecondary, textDecoration: "none" }}>
                <ChevronLeft size={16} /> Chapter {prevChapter}
              </a>
            ) : <span />}
            {nextChapter ? (
              <a href={`/bible/${book.id}/${nextChapter}?t=${translation}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSecondary, textDecoration: "none" }}>
                Chapter {nextChapter} <ChevronRight size={16} />
              </a>
            ) : <span />}
          </div>
        </div>
      </div>

      {/* Notes panel */}
      {noteOpen && (
        <div style={{ width: 320, borderLeft: `1px solid ${C.border}`, background: C.bgRaised, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0 }}>Notes — {book.name} {chapter}</h3>
            <button onClick={() => setNoteOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <textarea
            style={{ flex: 1, background: "transparent", color: C.textPrimary, fontSize: 13, padding: 16, resize: "none", border: "none", outline: "none", lineHeight: 1.7, fontFamily: "inherit" }}
            placeholder={`Write your notes for ${book.name} ${chapter}…`}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            {note && (
              <button
                onClick={deleteNote}
                title="Delete note"
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, display: "flex", flexShrink: 0 }}
              >
                <Trash2 size={14} />
              </button>
            )}
            {note?.updated_at && (
              <span style={{ fontSize: 11, color: C.textMuted }}>Saved {new Date(note.updated_at).toLocaleDateString()}</span>
            )}
            <button
              onClick={saveNote}
              disabled={noteSaving}
              style={{ marginLeft: "auto", padding: "6px 14px", background: C.gold, color: C.bg, fontSize: 12, fontWeight: 700, borderRadius: 6, border: "none", cursor: noteSaving ? "not-allowed" : "pointer", opacity: noteSaving ? 0.6 : 1 }}
            >
              {noteSaving ? "Saving…" : noteSaved ? "Saved ✓" : "Save note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
