"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark, BookmarkCheck, StickyNote, ChevronRight, ChevronLeft, AlertCircle, Trash2, Share2, Copy, Check, X as XIcon } from "lucide-react";
import { Book, Translation, Chapter, Bookmark as BookmarkType, Note } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ChapterViewProps {
  book: Book;
  chapter: number;
  translation: Translation;
  chapterData: Chapter | null;
  user: { id: string; email?: string } | null;
  initialBookmark: BookmarkType | null;
  initialNote: Note | null;
  openNote?: boolean;
  onVersesReady?: (verses: { number: number; text: string }[]) => void;
  externalHighlight?: number | null;
}

export default function ChapterView({ book, chapter, translation, chapterData, user, initialBookmark, initialNote, openNote, onVersesReady, externalHighlight }: ChapterViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [bookmark, setBookmark] = useState<BookmarkType | null>(initialBookmark);
  const [note, setNote] = useState<Note | null>(initialNote);
  const [noteOpen, setNoteOpen] = useState(openNote ?? false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  useEffect(() => {
    if (chapterData) onVersesReady?.(chapterData.verses);
  }, [chapterData]);

  useEffect(() => {
    document.cookie = `last_position=${book.id}:${chapter}:${translation};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, [book.id, chapter, translation]);

  useEffect(() => {
    if (externalHighlight != null) {
      setSelectedVerse(externalHighlight);
      setTimeout(() => {
        document.getElementById(`v${externalHighlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [externalHighlight]);

  const [copied, setCopied] = useState(false);

  function selectVerse(num: number) {
    setSelectedVerse(prev => prev === num ? null : num);
    setCopied(false);
  }

  function getVerseText(num: number) {
    const verse = chapterData?.verses.find(v => v.number === num);
    return verse ? verse.text.replace(/\n/g, " ").trim() : "";
  }

  function formatShareText(num: number) {
    return `"${getVerseText(num)}" — ${book.name} ${chapter}:${num} (${translation})`;
  }

  async function copyVerse(num: number) {
    await navigator.clipboard.writeText(formatShareText(num));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareVerse(num: number) {
    const text = formatShareText(num);
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await copyVerse(num);
    }
  }

  const [noteContent, setNoteContent] = useState(initialNote?.content ?? "");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const noteRef = useRef(note);
  const noteContentRef = useRef(noteContent);
  useEffect(() => { noteRef.current = note; }, [note]);
  useEffect(() => { noteContentRef.current = noteContent; }, [noteContent]);
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

  const saveNote = useCallback(async (content?: string) => {
    if (!user) return;
    const textToSave = content ?? noteContentRef.current;
    if (!textToSave.trim() && !noteRef.current) return;
    setNoteSaving(true);
    if (noteRef.current) {
      const { data } = await supabase.from("notes").update({ content: textToSave }).eq("id", noteRef.current.id).select().single();
      if (data) { setNote(data); noteRef.current = data; }
    } else {
      const { data } = await supabase.from("notes").insert({
        user_id: user.id, book_id: book.id, book_name: book.name,
        chapter, translation, content: textToSave,
      }).select().single();
      if (data) { setNote(data); noteRef.current = data; }
    }
    setNoteSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }, [user, book, chapter, translation, supabase]);

  function handleNoteChange(value: string) {
    setNoteContent(value);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveNote(value), 1500);
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
      <div className="flex flex-col items-center justify-center h-full gap-4 py-20 px-6 text-ink-secondary">
        <AlertCircle size={32} className="text-ink-muted" />
        <div className="text-center">
          <p className="font-semibold mb-1 text-ink-primary">Couldn&apos;t load this chapter</p>
          <p className="text-[13px] text-ink-muted">
            Check that your <code className="text-gold">BIBLE_API_KEY</code> is set in <code className="text-gold">.env.local</code>
          </p>
        </div>
        <a href="https://scripture.api.bible" target="_blank" rel="noopener noreferrer" className="text-xs text-gold">
          Get a free API key →
        </a>
      </div>
    );
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  return (
    <div className="flex h-full">
      {/* Reading pane */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto py-12 px-8">

          {/* Chapter heading */}
          <div className="mb-8">
            <h2 className="text-[22px] font-light mb-1 text-ink-primary font-reading">
              {book.name}
            </h2>
            <p className="text-xs text-ink-muted">Chapter {chapter} · {translation}</p>
            <div className="h-px mt-4 bg-gradient-to-r from-transparent via-gold-muted to-transparent" />
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-[10px] mb-8 flex-wrap">
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                bookmark
                  ? "border-gold-muted bg-gold/[9%] text-gold"
                  : "border-line-subtle bg-surface-raised text-ink-secondary"
              }`}
            >
              {bookmark ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {bookmark ? "Bookmarked" : "Bookmark"}
            </button>

            {/* Label editor */}
            {bookmark && labelEditing && (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={bookmarkLabel}
                  onChange={(e) => setBookmarkLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                  placeholder='Label (e.g. "Morning reading")'
                  className="text-xs px-[10px] py-[5px] bg-surface-overlay border border-line-subtle rounded-md text-ink-primary outline-none w-[180px]"
                />
                <button onClick={saveLabel} className="text-xs text-gold bg-transparent border-none cursor-pointer">Save</button>
              </div>
            )}
            {bookmark && !labelEditing && bookmark.label && (
              <button onClick={() => setLabelEditing(true)} className="text-xs text-ink-muted italic bg-transparent border-none cursor-pointer">
                &quot;{bookmark.label}&quot;
              </button>
            )}

            {/* Notes button */}
            <button
              onClick={() => { if (!user) { router.push("/auth/login"); return; } setNoteOpen(o => !o); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                noteOpen
                  ? "border-line bg-surface-overlay text-ink-primary"
                  : "border-line-subtle bg-surface-raised text-ink-secondary"
              } ${note ? "text-ink-primary" : ""}`}
            >
              <StickyNote size={13} />
              {note ? "View note" : "Add note"}
            </button>
          </div>

          {/* Bible text */}
          <div className="font-reading text-[17px] leading-loose text-ink-primary">
            {chapterData.verses.map((verse) => {
              const lines = verse.text.split("\n");
              const isSelected = selectedVerse === verse.number;
              return (
                <div key={verse.number}>
                  <p
                    id={`v${verse.number}`}
                    onClick={() => selectVerse(verse.number)}
                    className={`m-0 mb-1 px-2 py-1 rounded-md cursor-pointer border-l-2 transition-colors ${
                      isSelected ? "bg-gold/[7%] border-l-gold" : "bg-transparent border-l-transparent"
                    }`}
                  >
                    <sup className={`text-[10px] font-bold mr-[3px] font-sans align-super select-none ${isSelected ? "text-gold" : "text-gold-muted"}`}>
                      {verse.number}
                    </sup>
                    {lines.map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {i > 0 && <span className="inline-block w-6" />}
                        {line.trim()}
                      </span>
                    ))}
                  </p>

                  {/* Share popover */}
                  {isSelected && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2 bg-surface-raised border border-line-subtle rounded-lg flex-wrap">
                      <span className="text-[11px] text-ink-muted mr-1">
                        {book.name} {chapter}:{verse.number}
                      </span>
                      <button
                        onClick={() => copyVerse(verse.number)}
                        className={`flex items-center gap-[5px] px-[10px] py-1 bg-surface-overlay border border-line-subtle rounded-md text-[11px] font-semibold cursor-pointer ${copied ? "text-gold" : "text-ink-secondary"}`}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      {typeof navigator !== "undefined" && "share" in navigator && (
                        <button
                          onClick={() => shareVerse(verse.number)}
                          className="flex items-center gap-[5px] px-[10px] py-1 bg-surface-overlay border border-line-subtle rounded-md text-[11px] font-semibold text-ink-secondary cursor-pointer"
                        >
                          <Share2 size={12} /> Share
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedVerse(null)}
                        className="ml-auto bg-transparent border-none cursor-pointer text-ink-muted p-0.5"
                      >
                        <XIcon size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex justify-between items-center mt-16 pt-6 border-t border-t-line-subtle">
            {prevChapter ? (
              <a href={`/bible/${book.id}/${prevChapter}?t=${translation}`} className="flex items-center gap-1.5 text-[13px] text-ink-secondary no-underline">
                <ChevronLeft size={16} /> Chapter {prevChapter}
              </a>
            ) : <span />}
            {nextChapter ? (
              <a href={`/bible/${book.id}/${nextChapter}?t=${translation}`} className="flex items-center gap-1.5 text-[13px] text-ink-secondary no-underline">
                Chapter {nextChapter} <ChevronRight size={16} />
              </a>
            ) : <span />}
          </div>
        </div>
      </div>

      {/* Notes panel */}
      {noteOpen && (
        <div className="w-80 border-l border-l-line-subtle bg-surface-raised flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-b-line-subtle flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink-primary m-0">Notes — {book.name} {chapter}</h3>
            <button onClick={() => setNoteOpen(false)} className="bg-transparent border-none cursor-pointer text-ink-muted text-lg leading-none p-0">×</button>
          </div>
          <textarea
            className="flex-1 bg-transparent text-ink-primary text-[13px] p-4 resize-none border-none outline-none leading-[1.7] font-[inherit]"
            placeholder={`Write your notes for ${book.name} ${chapter}…`}
            value={noteContent}
            onChange={(e) => handleNoteChange(e.target.value)}
          />
          <div className="px-4 py-3 border-t border-t-line-subtle flex items-center justify-between gap-2">
            {note && (
              <button
                onClick={deleteNote}
                title="Delete note"
                className="bg-transparent border-none cursor-pointer text-ink-muted p-1 flex shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
            {note?.updated_at && (
              <span className="text-[11px] text-ink-muted">Saved {new Date(note.updated_at).toLocaleDateString()}</span>
            )}
            <button
              onClick={() => saveNote()}
              disabled={noteSaving}
              className={`ml-auto px-[14px] py-1.5 bg-gold text-surface text-xs font-bold rounded-md border-none ${noteSaving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {noteSaving ? "Saving…" : noteSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
