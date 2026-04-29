"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark, BookmarkCheck, StickyNote, ChevronRight, ChevronLeft, AlertCircle, Trash2, Share2, Copy, Check, X as XIcon, Volume2, Play, Pause, Square } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { Book, Translation, Chapter, Bookmark as BookmarkType, Note, Highlight } from "@/types";

const HIGHLIGHT_COLORS = [
  { id: "yellow", bg: "rgba(201,168,76,0.22)",  swatch: "#c9a84c" },
  { id: "green",  bg: "rgba(74,163,120,0.22)",  swatch: "#4aa378" },
  { id: "blue",   bg: "rgba(74,120,201,0.22)",  swatch: "#4a78c9" },
  { id: "rose",   bg: "rgba(220,100,110,0.22)", swatch: "#dc646e" },
  { id: "purple", bg: "rgba(150,100,220,0.22)", swatch: "#9664dc" },
] as const;
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
  initialHighlights: Highlight[];
  openNote?: boolean;
  onVersesReady?: (verses: { number: number; text: string }[]) => void;
  externalHighlight?: number | null;
}

export default function ChapterView({ book, chapter, translation, chapterData, user, initialBookmark, initialNote, initialHighlights, openNote, onVersesReady, externalHighlight }: ChapterViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [bookmark, setBookmark] = useState<BookmarkType | null>(initialBookmark);
  const [note, setNote] = useState<Note | null>(initialNote);
  const [noteOpen, setNoteOpen] = useState(openNote ?? false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [highlights, setHighlights] = useState<Record<number, string>>(
    Object.fromEntries(initialHighlights.map((h) => [h.verse, h.color]))
  );

  const speech = useSpeech(chapterData?.verses ?? []);

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
  const highlightInFlight = useRef(false);

  // Strong's
  const [strongsOpen, setStrongsOpen] = useState<number | null>(null);
  const [strongsCache, setStrongsCache] = useState<Record<number, { word: string; strongs: string; lemma: string; def: string; xlit?: string }[]>>({});
  const [strongsLoading, setStrongsLoading] = useState(false);
  const [activeStrongsKey, setActiveStrongsKey] = useState<string | null>(null);

  async function loadStrongs(verseNum: number) {
    if (strongsOpen === verseNum) { setStrongsOpen(null); setActiveStrongsKey(null); return; }
    setStrongsOpen(verseNum);
    setActiveStrongsKey(null);
    if (strongsCache[verseNum]) return;
    setStrongsLoading(true);
    try {
      const res = await fetch(`/api/strongs?bookId=${book.id}&chapter=${chapter}&verse=${verseNum}`);
      const data = await res.json();
      setStrongsCache((prev) => ({ ...prev, [verseNum]: data.words ?? [] }));
    } finally {
      setStrongsLoading(false);
    }
  }

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
    const text = formatShareText(num);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers that deny clipboard permission
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
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

  async function toggleHighlight(verseNum: number, colorId: string) {
    if (!user) { router.push("/auth/login"); return; }
    if (highlightInFlight.current) return;
    highlightInFlight.current = true;
    try {
      if (highlights[verseNum] === colorId) {
        const { error } = await supabase.from("highlights").delete()
          .eq("user_id", user.id).eq("book_id", book.id)
          .eq("chapter", chapter).eq("verse", verseNum).eq("translation", translation);
        if (!error) setHighlights((prev) => { const next = { ...prev }; delete next[verseNum]; return next; });
      } else {
        const { error } = await supabase.from("highlights").upsert(
          { user_id: user.id, book_id: book.id, chapter, verse: verseNum, translation, color: colorId },
          { onConflict: "user_id,book_id,chapter,verse,translation" }
        );
        if (!error) setHighlights((prev) => ({ ...prev, [verseNum]: colorId }));
      }
    } finally {
      highlightInFlight.current = false;
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
      const { error } = await supabase.from("bookmarks").delete().eq("id", bookmark.id);
      if (!error) { setBookmark(null); setBookmarkLabel(""); }
    } else {
      const { data } = await supabase.from("bookmarks").insert({
        user_id: user.id, book_id: book.id, book_name: book.name,
        chapter, translation, label: "",
      }).select().single();
      if (data) { setBookmark(data); setLabelEditing(true); }
    }
  }

  async function saveLabel() {
    if (!bookmark) return;
    const { error } = await supabase.from("bookmarks").update({ label: bookmarkLabel, sorted_at: new Date().toISOString() }).eq("id", bookmark.id);
    if (!error) { setLabelEditing(false); setBookmark({ ...bookmark, label: bookmarkLabel }); }
  }

  const saveNote = useCallback(async (content?: string) => {
    if (!user) return;
    const textToSave = content ?? noteContentRef.current;
    if (!textToSave.trim() && !noteRef.current) return;
    setNoteSaving(true);
    if (noteRef.current) {
      const { data, error } = await supabase.from("notes").update({ content: textToSave }).eq("id", noteRef.current.id).select().single();
      if (!error && data) { setNote(data); noteRef.current = data; }
    } else {
      const { data, error } = await supabase.from("notes").insert({
        user_id: user.id, book_id: book.id, book_name: book.name,
        chapter, translation, content: textToSave,
      }).select().single();
      if (!error && data) { setNote(data); noteRef.current = data; }
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
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (!error) { setNote(null); setNoteContent(""); setNoteOpen(false); }
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);

  return (
    <div className="flex h-full">
      {/* Reading pane */}
      <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
          setReadProgress(isNaN(pct) ? 0 : Math.min(pct, 1));
        }}
      >
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

            {/* Listen button */}
            {speech.supported && speech.state === "idle" && (
              <button
                onClick={speech.play}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-line-subtle bg-surface-raised text-ink-secondary"
              >
                <Volume2 size={13} /> Listen
              </button>
            )}
          </div>

          {/* Audio player bar */}
          {speech.state !== "idle" && (
            <div className="flex items-center gap-3 px-3 py-2 mb-6 bg-surface-overlay border border-line-subtle rounded-lg">
              <button
                onClick={speech.state === "playing" ? speech.pause : speech.resume}
                className="bg-transparent border-none cursor-pointer text-ink-primary p-0.5 flex"
                aria-label={speech.state === "playing" ? "Pause" : "Resume"}
              >
                {speech.state === "playing" ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div className="flex-1 text-[12px] text-ink-secondary">
                {speech.activeVerse ? `Verse ${speech.activeVerse}` : "Listening…"}
              </div>
              <div className="flex items-center gap-1">
                {[0.8, 1, 1.25, 1.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => speech.changeRate(r)}
                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer border-none ${
                      speech.rate === r ? "bg-gold text-surface font-bold" : "bg-transparent text-ink-muted"
                    }`}
                  >
                    {r}×
                  </button>
                ))}
              </div>
              <button
                onClick={speech.stop}
                className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5 flex"
                aria-label="Stop"
              >
                <Square size={13} />
              </button>
            </div>
          )}

          {/* Bible text */}
          <div className="font-reading leading-loose text-ink-primary" style={{ fontSize: "var(--reading-font-size, 17px)" }}>
            {chapterData.verses.map((verse) => {
              const lines = verse.text.split("\n");
              const isSelected = selectedVerse === verse.number;
              const isNarrating = speech.activeVerse === verse.number;
              const highlightColor = HIGHLIGHT_COLORS.find((c) => c.id === highlights[verse.number]);
              return (
                <div key={verse.number}>
                  <p
                    id={`v${verse.number}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectVerse(verse.number)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectVerse(verse.number); } }}
                    className={`m-0 mb-1 px-2 py-1 rounded-md cursor-pointer border-l-2 transition-colors ${
                      isSelected ? "border-l-gold" : isNarrating ? "border-l-gold" : "border-l-transparent"
                    }`}
                    style={{
                      backgroundColor: isNarrating
                        ? "rgba(201,168,76,0.15)"
                        : isSelected
                        ? "rgba(201,168,76,0.07)"
                        : highlightColor?.bg,
                      transition: "background-color 0.3s ease",
                    }}
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

                  {/* Verse popover */}
                  {isSelected && (
                    <div className="px-2 py-1.5 mb-2 bg-surface-raised border border-line-subtle rounded-lg">
                      {/* Copy / share row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                      {/* Highlight row */}
                      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-line-subtle">
                        <span className="text-[10px] text-ink-muted">Highlight</span>
                        <div className="flex items-center gap-1.5">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => toggleHighlight(verse.number, c.id)}
                              style={{ backgroundColor: c.swatch }}
                              className={`w-4 h-4 rounded-full cursor-pointer border-2 transition-transform ${
                                highlights[verse.number] === c.id ? "border-ink-primary scale-110" : "border-transparent"
                              }`}
                              aria-label={`Highlight ${c.id}`}
                            />
                          ))}
                        </div>
                        {highlights[verse.number] && (
                          <button
                            onClick={() => toggleHighlight(verse.number, highlights[verse.number])}
                            className="ml-auto flex items-center gap-1 text-[10px] text-ink-muted bg-transparent border-none cursor-pointer px-1"
                            aria-label="Remove highlight"
                          >
                            <XIcon size={11} /> Remove
                          </button>
                        )}
                      </div>

                      {/* Strong's row — KJV/NKJV only */}
                      {(translation === "KJV" || translation === "NKJV") && (
                        <div className="mt-1.5 pt-1.5 border-t border-line-subtle">
                          <button
                            onClick={() => loadStrongs(verse.number)}
                            className="text-[10px] font-semibold text-gold-muted bg-transparent border-none cursor-pointer p-0 leading-none"
                          >
                            {strongsOpen === verse.number ? "▲ Hide Strong's" : "▼ Strong's"}
                          </button>

                          {strongsOpen === verse.number && (
                            <div className="mt-2">
                              {strongsLoading && !strongsCache[verse.number] ? (
                                <p className="text-[10px] text-ink-muted m-0">Loading…</p>
                              ) : (strongsCache[verse.number] ?? []).length === 0 ? (
                                <p className="text-[10px] text-ink-muted m-0">No data for this verse.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(strongsCache[verse.number] ?? []).map((w, i) => {
                                    const key = `${verse.number}-${i}`;
                                    const isActive = activeStrongsKey === key;
                                    return (
                                      <button
                                        key={key}
                                        onClick={() => setActiveStrongsKey(isActive ? null : key)}
                                        className={`flex flex-col items-start px-1.5 py-0.5 rounded text-left cursor-pointer border transition-colors ${
                                          isActive
                                            ? "border-gold bg-gold/[8%]"
                                            : "border-line-subtle bg-surface-overlay"
                                        }`}
                                      >
                                        <span className="text-[10px] text-ink-primary leading-tight">{w.word}</span>
                                        <span className="text-[9px] font-mono text-gold-muted">{w.strongs}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Definition card */}
                              {activeStrongsKey && activeStrongsKey.startsWith(`${verse.number}-`) && (() => {
                                const idx = parseInt(activeStrongsKey.split("-")[1], 10);
                                const entry = strongsCache[verse.number]?.[idx];
                                if (!entry) return null;
                                return (
                                  <div className="mt-2 p-2 bg-surface-overlay border border-gold-muted/30 rounded-md">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-[10px] font-mono text-gold">{entry.strongs}</span>
                                      {entry.lemma && <span className="text-[13px] font-semibold text-ink-primary">{entry.lemma}</span>}
                                      {entry.xlit && <span className="text-[10px] text-ink-muted italic">{entry.xlit}</span>}
                                    </div>
                                    {entry.def && <p className="text-[11px] text-ink-secondary mt-0.5 m-0 leading-snug">{entry.def}</p>}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
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
      <div className="h-[3px] bg-line-subtle shrink-0">
        <div className="h-full" style={{ width: `${readProgress * 100}%`, backgroundColor: "var(--gold)", opacity: 0.8, transition: "width 75ms linear" }} />
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
