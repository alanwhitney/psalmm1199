"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark, BookmarkCheck, StickyNote, ChevronRight, ChevronLeft, AlertCircle, Share2, Copy, Check, X as XIcon, Volume2, Play, Pause, Square, Printer, Map } from "lucide-react";
import Link from "next/link";
import { useSpeech } from "@/hooks/useSpeech";
import { useTheme } from "@/components/ThemeProvider";
import { Book, Translation, Chapter, Bookmark as BookmarkType, Note, Highlight } from "@/types";
import { WJ_OPEN, WJ_CLOSE, stripWj } from "@/lib/bible-api";
import { MapPlace } from "@/lib/chapter-places";
import MapPanel from "./MapPanel";
import NotesPanel from "./NotesPanel";
import StrongsModal, { StrongsModalData } from "./StrongsModal";

const SCROLL_DELAY_EXTERNAL = 100;  // let React finish painting before scrolling to an externally-highlighted verse
const SCROLL_DELAY_HASH = 150;      // slightly longer for hash nav — page may still be settling on first mount
const COPY_FEEDBACK_MS = 2000;      // how long "Copied" UI state stays visible
const NOTE_SAVE_FEEDBACK_MS = 2000; // how long "Saved" indicator stays visible after a note saves
const NOTE_AUTOSAVE_DEBOUNCE = 1500; // debounce delay before auto-saving a note in progress
const SCROLL_SAVE_DEBOUNCE = 300;    // debounce delay before persisting scroll position to sessionStorage

function renderWjText(text: string): React.ReactNode {
  if (!text.includes(WJ_OPEN)) return text;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const open = text.indexOf(WJ_OPEN, i);
    if (open === -1) { parts.push(text.slice(i)); break; }
    if (open > i) parts.push(text.slice(i, open));
    const close = text.indexOf(WJ_CLOSE, open + 1);
    if (close === -1) { parts.push(<span key={key++} className="wj">{text.slice(open + 1)}</span>); break; }
    parts.push(<span key={key++} className="wj">{text.slice(open + 1, close)}</span>);
    i = close + 1;
  }
  return <>{parts}</>;
}

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
  initialNotes: Note[];
  initialHighlights: Highlight[];
  openNote?: boolean;
  onNoteOpenChange?: (open: boolean) => void;
  onVersesReady?: (verses: { number: number; text: string }[]) => void;
  externalHighlight?: number | null;
  mapPlaces?: MapPlace[];
}

export default function ChapterView({ book, chapter, translation, chapterData, user, initialBookmark, initialNotes, initialHighlights, openNote, onNoteOpenChange, onVersesReady, externalHighlight, mapPlaces = [] }: ChapterViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showSections } = useTheme();
  const redLetter = translation === "KJV" || translation === "NIV";

  const [bookmark, setBookmark] = useState<BookmarkType | null>(initialBookmark);
  const [noteOpen, setNoteOpen] = useState(openNote ?? false);
  const [mapOpen, setMapOpen] = useState(false);

  function openNotes() { setMapOpen(false); setNoteOpen(true); }
  function openMap() { setNoteOpen(false); setMapOpen(true); }

  useEffect(() => {
    onNoteOpenChange?.(noteOpen);
    const url = new URL(window.location.href);
    if (noteOpen) { url.searchParams.set("note", "1"); } else { url.searchParams.delete("note"); }
    window.history.replaceState(null, "", url.toString());
  }, [noteOpen]);

  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [flashVerse, setFlashVerse] = useState<number | null>(null);

  // Briefly highlight a verse — used when arriving via search or external link
  function flashAndScroll(verseNum: number, delayMs: number) {
    setSelectedVerse(verseNum);
    setFlashVerse(verseNum);
    setTimeout(() => setFlashVerse(prev => (prev === verseNum ? null : prev)), 2500);
    setTimeout(() => {
      document.getElementById(`v${verseNum}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, delayMs);
  }
  const [highlights, setHighlights] = useState<Record<number, string>>(
    Object.fromEntries(initialHighlights.map((h) => [h.verse, h.color]))
  );

  // Notes state — verse-keyed
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [noteContents, setNoteContents] = useState<Record<number, string>>(
    Object.fromEntries(initialNotes.map(n => [n.verse, n.content]))
  );
  const [expandedVerse, setExpandedVerse] = useState<number | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSavedVerse, setNoteSavedVerse] = useState<number | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingSave = useRef<{ verse: number; content: string } | null>(null);

  const speech = useSpeech(chapterData?.verses ?? []);

  useEffect(() => {
    if (chapterData) onVersesReady?.(chapterData.verses.map(v => ({ ...v, text: stripWj(v.text) })));
  }, [chapterData]);

  useEffect(() => {
    document.cookie = `last_position=${book.id}:${chapter}:${translation};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, [book.id, chapter, translation]);

  useEffect(() => {
    if (externalHighlight != null) flashAndScroll(externalHighlight, SCROLL_DELAY_EXTERNAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalHighlight]);

  useEffect(() => {
    const match = window.location.hash.match(/^#v(\d+)$/);
    if (match) flashAndScroll(parseInt(match[1], 10), SCROLL_DELAY_HASH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [copied, setCopied] = useState(false);
  const highlightInFlight = useRef(false);

  // Cross-references
  const [xrefOpen, setXrefOpen] = useState<number | null>(null);
  const [xrefCache, setXrefCache] = useState<Record<number, { bookId: string; chapter: number; verse: number; label: string; href: string }[]>>({});
  const [xrefLoading, setXrefLoading] = useState(false);
  const [xrefError, setXrefError] = useState<Record<number, string>>({});

  function toggleXrefs(verseNum: number) {
    if (xrefOpen === verseNum) { setXrefOpen(null); return; }
    setXrefOpen(verseNum);
    if (!xrefCache[verseNum]) fetchXrefs(verseNum);
  }

  async function fetchXrefs(verseNum: number) {
    setXrefError(prev => { const next = { ...prev }; delete next[verseNum]; return next; });
    setXrefLoading(true);
    try {
      const res = await fetch(`/api/crossrefs?bookId=${book.id}&chapter=${chapter}&verse=${verseNum}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setXrefCache(prev => ({ ...prev, [verseNum]: data.refs ?? [] }));
    } catch (err) {
      setXrefError(prev => ({ ...prev, [verseNum]: err instanceof Error ? err.message : "Couldn't load cross-references" }));
    } finally {
      setXrefLoading(false);
    }
  }

  // Strong's
  const [strongsOpen, setStrongsOpen] = useState<number | null>(null);
  const [strongsCache, setStrongsCache] = useState<Record<number, { word: string; strongs: string; lemma: string; def: string; xlit?: string; derivation?: string }[]>>({});
  const [strongsLoading, setStrongsLoading] = useState(false);
  const [activeStrongsKey, setActiveStrongsKey] = useState<string | null>(null);
  const [linkedEntry, setLinkedEntry] = useState<{ id: string; lemma?: string; def?: string; xlit?: string; derivation?: string } | null>(null);
  const [linkedEntryLoading, setLinkedEntryLoading] = useState(false);
  const [concordanceCache, setConcordanceCache] = useState<Record<string, { count: number; verses: { b: number; c: number; v: number }[]; kjvWords?: { word: string; count: number }[] } | null>>({});
  const [concordanceLoading, setConcordanceLoading] = useState(false);
  const [concordanceError, setConcordanceError] = useState<Record<string, string>>({});

  async function fetchConcordance(id: string) {
    setConcordanceError(prev => { const next = { ...prev }; delete next[id]; return next; });
    setConcordanceLoading(true);
    try {
      const res = await fetch(`/api/strongs/concordance?id=${id}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setConcordanceCache(prev => ({ ...prev, [id]: data?.verses ? data : null }));
    } catch (err) {
      setConcordanceError(prev => ({ ...prev, [id]: err instanceof Error ? err.message : "Couldn't load concordance" }));
    } finally {
      setConcordanceLoading(false);
    }
  }
  const [strongsModal, setStrongsModal] = useState<StrongsModalData | null>(null);

  const [strongsError, setStrongsError] = useState<Record<number, string>>({});

  function toggleStrongs(verseNum: number) {
    if (strongsOpen === verseNum) { setStrongsOpen(null); setActiveStrongsKey(null); setLinkedEntry(null); return; }
    setStrongsOpen(verseNum);
    setActiveStrongsKey(null);
    setLinkedEntry(null);
    if (!strongsCache[verseNum]) fetchStrongs(verseNum);
  }

  async function fetchStrongs(verseNum: number) {
    setStrongsError(prev => { const next = { ...prev }; delete next[verseNum]; return next; });
    setStrongsLoading(true);
    try {
      const res = await fetch(`/api/strongs?bookId=${book.id}&chapter=${chapter}&verse=${verseNum}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setStrongsCache((prev) => ({ ...prev, [verseNum]: data.words ?? [] }));
    } catch (err) {
      setStrongsError(prev => ({ ...prev, [verseNum]: err instanceof Error ? err.message : "Couldn't load Strong's data" }));
    } finally {
      setStrongsLoading(false);
    }
  }

  async function loadLinkedEntry(id: string) {
    if (linkedEntry?.id === id) { setLinkedEntry(null); return; }
    setLinkedEntryLoading(true);
    try {
      const res = await fetch(`/api/strongs/entry?id=${id}`);
      const data = await res.json();
      setLinkedEntry({ id, ...data });
    } finally {
      setLinkedEntryLoading(false);
    }
  }

  function renderDerivation(text: string) {
    const parts = text.split(/([HG]\d+)/g);
    return parts.map((part, i) =>
      /^[HG]\d+$/.test(part) ? (
        <button key={i} onClick={() => loadLinkedEntry(part)}
          className={`font-mono text-[10px] cursor-pointer border-none bg-transparent px-0 underline decoration-dotted ${linkedEntry?.id === part ? "text-gold" : "text-gold-muted"}`}>
          {part}
        </button>
      ) : <span key={i}>{part}</span>
    );
  }

  useEffect(() => {
    if (!activeStrongsKey) return;
    const [verseStr, idxStr] = activeStrongsKey.split("-");
    const entry = strongsCache[parseInt(verseStr, 10)]?.[parseInt(idxStr, 10)];
    if (!entry) return;
    const id = entry.strongs;
    if (id in concordanceCache || id in concordanceError) return;
    fetchConcordance(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStrongsKey, strongsCache, concordanceCache, concordanceError]);

  function selectVerse(num: number) {
    setSelectedVerse(prev => {
      if (prev !== num) { setXrefOpen(null); setStrongsOpen(null); }
      return prev === num ? null : num;
    });
    setCopied(false);
  }

  function getVerseText(num: number) {
    const verse = chapterData?.verses.find(v => v.number === num);
    return verse ? stripWj(verse.text.replace(/\n/g, " ").trim()) : "";
  }

  function formatShareText(num: number) {
    return `"${getVerseText(num)}" — ${book.name} ${chapter}:${num} (${translation})`;
  }

  async function copyVerse(num: number) {
    const text = formatShareText(num);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }

  async function shareVerse(num: number) {
    const text = formatShareText(num);
    if (navigator.share) { await navigator.share({ text }); } else { await copyVerse(num); }
  }

  async function toggleHighlight(verseNum: number, colorId: string) {
    if (!user) { router.push("/auth/login"); return; }
    if (highlightInFlight.current) return;
    highlightInFlight.current = true;
    try {
      if (highlights[verseNum] === colorId) {
        const { error } = await supabase.from("highlights").delete()
          .eq("user_id", user.id).eq("book_id", book.id).eq("chapter", chapter).eq("verse", verseNum).eq("translation", translation);
        if (!error) setHighlights((prev) => { const next = { ...prev }; delete next[verseNum]; return next; });
      } else {
        const { error } = await supabase.from("highlights").upsert(
          { user_id: user.id, book_id: book.id, chapter, verse: verseNum, translation, color: colorId },
          { onConflict: "user_id,book_id,chapter,verse,translation" }
        );
        if (!error) setHighlights((prev) => ({ ...prev, [verseNum]: colorId }));
      }
    } finally { highlightInFlight.current = false; }
  }

  const [bookmarkLabel, setBookmarkLabel] = useState(initialBookmark?.label ?? "");
  const [labelEditing, setLabelEditing] = useState(false);

  async function toggleBookmark() {
    if (!user) { router.push("/auth/login"); return; }
    if (bookmark) {
      const { error } = await supabase.from("bookmarks").delete().eq("id", bookmark.id);
      if (!error) { setBookmark(null); setBookmarkLabel(""); router.refresh(); }
    } else {
      const { data } = await supabase.from("bookmarks").insert({
        user_id: user.id, book_id: book.id, book_name: book.name, chapter, translation, label: "",
      }).select().single();
      if (data) { setBookmark(data); setLabelEditing(true); router.refresh(); }
    }
  }

  async function saveLabel() {
    if (!bookmark) return;
    const { error } = await supabase.from("bookmarks").update({ label: bookmarkLabel, sorted_at: new Date().toISOString() }).eq("id", bookmark.id);
    if (!error) { setLabelEditing(false); setBookmark({ ...bookmark, label: bookmarkLabel }); router.refresh(); }
  }

  const saveNote = useCallback(async (verseNum: number, content: string) => {
    if (!user) return;
    if (!content.trim()) return;
    setNoteSaving(true);
    const existing = notes.find(n => n.verse === verseNum);
    if (existing) {
      const { data } = await supabase.from("notes").update({ content }).eq("id", existing.id).select().single();
      if (data) setNotes(prev => prev.map(n => n.verse === verseNum ? data : n));
    } else {
      const { data } = await supabase.from("notes").insert({
        user_id: user.id, book_id: book.id, book_name: book.name, chapter, verse: verseNum, content,
      }).select().single();
      if (data) setNotes(prev => [...prev, data].sort((a, b) => a.verse - b.verse));
    }
    setNoteSaving(false);
    setNoteSavedVerse(verseNum);
    setTimeout(() => setNoteSavedVerse(null), NOTE_SAVE_FEEDBACK_MS);
  }, [user, book, chapter, supabase, notes]);

  function handleNoteChange(verseNum: number, value: string) {
    setNoteContents(prev => ({ ...prev, [verseNum]: value }));
    pendingSave.current = { verse: verseNum, content: value };
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (pendingSave.current) saveNote(pendingSave.current.verse, pendingSave.current.content);
    }, NOTE_AUTOSAVE_DEBOUNCE);
  }

  async function deleteNote(noteId: string, verseNum: number) {
    await supabase.from("notes").delete().eq("id", noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setNoteContents(prev => { const next = { ...prev }; delete next[verseNum]; return next; });
    if (expandedVerse === verseNum) setExpandedVerse(null);
  }

  function openNoteForVerse(verseNum: number) {
    if (!user) { router.push("/auth/login"); return; }
    if (!(verseNum in noteContents)) {
      const existing = notes.find(n => n.verse === verseNum);
      setNoteContents(prev => ({ ...prev, [verseNum]: existing?.content ?? "" }));
    }
    setNoteOpen(true);
    setExpandedVerse(verseNum);
  }

  function savedLabel(verseNum: number): string {
    const n = notes.find(n => n.verse === verseNum);
    if (!n?.updated_at) return "";
    const d = new Date(n.updated_at);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString();
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
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readProgress, setReadProgress] = useState(0);

  const scrollKey = `scroll:${book.id}:${chapter}`;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || window.location.hash) return;
    const saved = sessionStorage.getItem(scrollKey);
    if (saved) el.scrollTop = parseInt(saved, 10);
  }, [scrollKey]);

  return (
    <div className="flex h-full relative">
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
            if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
            scrollSaveTimer.current = setTimeout(() => {
              sessionStorage.setItem(scrollKey, String(el.scrollTop));
            }, SCROLL_SAVE_DEBOUNCE);
          }}
        >
          <div className="max-w-[680px] mx-auto py-12 px-8">

            {/* Chapter heading */}
            <div className="mb-8">
              <h2 className="text-[22px] font-light mb-1 text-ink-primary font-reading">{book.name}</h2>
              <p className="text-xs text-ink-muted">Chapter {chapter} · {translation}</p>
              <div className="h-px mt-4 bg-gradient-to-r from-transparent via-gold-muted to-transparent" />
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-[10px] mb-8 flex-wrap">
              {/* Bookmark */}
              <button onClick={toggleBookmark} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${bookmark ? "border-gold-muted bg-gold/[9%] text-gold" : "border-line-subtle bg-surface-raised text-ink-secondary"}`}>
                {bookmark ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {bookmark ? "Bookmarked" : "Bookmark"}
              </button>
              {bookmark && labelEditing && (
                <div className="flex items-center gap-2">
                  <input autoFocus value={bookmarkLabel} onChange={(e) => setBookmarkLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                    placeholder='Label (e.g. "Morning reading")'
                    className="text-xs px-[10px] py-[5px] bg-surface-overlay border border-line-subtle rounded-md text-ink-primary outline-none w-[180px]" />
                  <button onClick={saveLabel} className="text-xs text-gold bg-transparent border-none cursor-pointer">Save</button>
                </div>
              )}
              {bookmark && !labelEditing && bookmark.label && (
                <button onClick={() => setLabelEditing(true)} className="text-xs text-ink-muted italic bg-transparent border-none cursor-pointer">&quot;{bookmark.label}&quot;</button>
              )}

              {/* Notes */}
              <button
                onClick={() => { if (!user) { router.push("/auth/login"); return; } noteOpen ? setNoteOpen(false) : openNotes(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${noteOpen ? "border-line bg-surface-overlay text-ink-primary" : notes.length > 0 ? "border-line-subtle bg-surface-raised text-ink-primary" : "border-line-subtle bg-surface-raised text-ink-secondary"}`}
              >
                <StickyNote size={13} />
                Notes{notes.length > 0 ? ` · ${notes.length}` : ""}
              </button>

              {/* Map */}
              {mapPlaces.length > 0 && (
                <button
                  onClick={() => mapOpen ? setMapOpen(false) : openMap()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${mapOpen ? "border-line bg-surface-overlay text-ink-primary" : "border-line-subtle bg-surface-raised text-ink-secondary"}`}
                >
                  <Map size={13} />
                  Map
                </button>
              )}

              {/* Listen */}
              {speech.supported && speech.state === "idle" && (
                <button onClick={speech.play} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-line-subtle bg-surface-raised text-ink-secondary">
                  <Volume2 size={13} /> Listen
                </button>
              )}

              {/* Print */}
              <Link
                href={`/bible/${book.id}/${chapter}/print?t=${translation}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-line-subtle bg-surface-raised text-ink-secondary no-underline"
              >
                <Printer size={13} /> Print
              </Link>
            </div>

            {/* Audio player bar */}
            {speech.state !== "idle" && (
              <div className="flex items-center gap-3 px-3 py-2 mb-6 bg-surface-overlay border border-line-subtle rounded-lg">
                <button onClick={speech.state === "playing" ? speech.pause : speech.resume} className="bg-transparent border-none cursor-pointer text-ink-primary p-0.5 flex" aria-label={speech.state === "playing" ? "Pause" : "Resume"}>
                  {speech.state === "playing" ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <div className="flex-1 text-[12px] text-ink-secondary">{speech.activeVerse ? `Verse ${speech.activeVerse}` : "Listening…"}</div>
                <div className="flex items-center gap-1">
                  {[0.8, 1, 1.25, 1.5].map((r) => (
                    <button key={r} onClick={() => speech.changeRate(r)} className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer border-none ${speech.rate === r ? "bg-gold text-surface font-bold" : "bg-transparent text-ink-muted"}`}>{r}×</button>
                  ))}
                </div>
                <button onClick={speech.stop} className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5 flex" aria-label="Stop"><Square size={13} /></button>
              </div>
            )}

            {/* Bible text */}
            <div className={`font-reading leading-loose text-ink-primary${redLetter ? " red-letter" : ""}`} style={{ fontSize: "var(--reading-font-size, 17px)" }}>
              {chapterData.verses.map((verse) => {
                const lines = verse.text.split("\n");
                const isSelected = selectedVerse === verse.number;
                const isFlash = flashVerse === verse.number;
                const isNarrating = speech.activeVerse === verse.number;
                const highlightColor = HIGHLIGHT_COLORS.find((c) => c.id === highlights[verse.number]);
                const heading = showSections ? chapterData.headings?.[verse.number] : null;
                const hasNote = notes.some(n => n.verse === verse.number);
                return (
                  <div key={verse.number}>
                    {heading && <h3 className="section-heading">{heading}</h3>}
                    <p
                      id={`v${verse.number}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`Verse ${verse.number}`}
                      onClick={() => selectVerse(verse.number)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectVerse(verse.number); } }}
                      className={`m-0 mb-1 px-2 py-1 rounded-md cursor-pointer border-l-2 transition-colors ${isSelected || isFlash || isNarrating ? "border-l-gold" : "border-l-transparent"}`}
                      style={{ backgroundColor: isFlash ? "rgba(201,168,76,0.35)" : isNarrating ? "rgba(201,168,76,0.15)" : isSelected ? "rgba(201,168,76,0.07)" : highlightColor?.bg, transition: "background-color 0.8s ease" }}
                    >
                      <sup className={`text-[10px] font-bold mr-[3px] font-sans align-super select-none ${isSelected ? "text-gold" : "text-gold-muted"}`}>
                        {verse.number}
                      </sup>
                      {hasNote && <span className="inline-block w-[5px] h-[5px] rounded-full mb-[3px] mr-[3px] align-super select-none" style={{ backgroundColor: "var(--gold)", opacity: 0.7 }} />}
                      {lines.map((line, i) => (
                        <span key={i}>
                          {i > 0 && <br />}
                          {i > 0 && <span className="inline-block w-6" />}
                          {renderWjText(line.trim())}
                        </span>
                      ))}
                    </p>

                    {/* Verse popover */}
                    {isSelected && (
                      <div className="px-2 py-1.5 mb-2 bg-surface-raised border border-line-subtle rounded-lg">
                        {/* Copy / share row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-ink-muted mr-1">{book.name} {chapter}:{verse.number}</span>
                          <button onClick={() => copyVerse(verse.number)} className={`flex items-center gap-[5px] px-[10px] py-1 bg-surface-overlay border border-line-subtle rounded-md text-[11px] font-semibold cursor-pointer ${copied ? "text-gold" : "text-ink-secondary"}`}>
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? "Copied!" : "Copy"}
                          </button>
                          {typeof navigator !== "undefined" && "share" in navigator && (
                            <button onClick={() => shareVerse(verse.number)} className="flex items-center gap-[5px] px-[10px] py-1 bg-surface-overlay border border-line-subtle rounded-md text-[11px] font-semibold text-ink-secondary cursor-pointer">
                              <Share2 size={12} /> Share
                            </button>
                          )}
                          <button onClick={() => setSelectedVerse(null)} className="ml-auto bg-transparent border-none cursor-pointer text-ink-muted p-0.5">
                            <XIcon size={13} />
                          </button>
                        </div>

                        {/* Highlight row */}
                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-line-subtle">
                          <span className="text-[10px] text-ink-muted">Highlight</span>
                          <div className="flex items-center gap-1.5">
                            {HIGHLIGHT_COLORS.map((c) => (
                              <button key={c.id} onClick={() => toggleHighlight(verse.number, c.id)} style={{ backgroundColor: c.swatch }}
                                className={`w-4 h-4 rounded-full cursor-pointer border-2 transition-transform ${highlights[verse.number] === c.id ? "border-ink-primary scale-110" : "border-transparent"}`}
                                aria-label={`Highlight ${c.id}`} />
                            ))}
                          </div>
                          {highlights[verse.number] && (
                            <button onClick={() => toggleHighlight(verse.number, highlights[verse.number])} className="ml-auto flex items-center gap-1 text-[10px] text-ink-muted bg-transparent border-none cursor-pointer px-1" aria-label="Remove highlight">
                              <XIcon size={11} /> Remove
                            </button>
                          )}
                        </div>

                        {/* Note row */}
                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-line-subtle">
                          <button
                            onClick={() => openNoteForVerse(verse.number)}
                            className={`flex items-center gap-[5px] px-[10px] py-1 bg-surface-overlay border border-line-subtle rounded-md text-[11px] font-semibold cursor-pointer ${hasNote ? "text-gold" : "text-ink-secondary"}`}
                          >
                            <StickyNote size={12} />
                            {hasNote ? "Edit note" : "Add note"}
                          </button>
                        </div>

                        {/* Cross-references row */}
                        <div className="mt-1.5 pt-1.5 border-t border-line-subtle">
                          <button onClick={() => toggleXrefs(verse.number)} className="text-[10px] font-semibold text-gold-muted bg-transparent border-none cursor-pointer p-0 leading-none">
                            {xrefOpen === verse.number ? "▲ Hide cross-refs" : "▼ Cross-refs"}
                          </button>
                          {xrefOpen === verse.number && (
                            <div className="mt-2">
                              {xrefLoading && !xrefCache[verse.number] && !xrefError[verse.number] ? (
                                <p className="text-[10px] text-ink-muted m-0">Loading…</p>
                              ) : xrefError[verse.number] ? (
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-red-400 m-0">Couldn&apos;t load cross-references.</p>
                                  <button onClick={() => fetchXrefs(verse.number)} className="text-[10px] text-gold-muted bg-transparent border-none cursor-pointer p-0 underline font-semibold">
                                    Retry
                                  </button>
                                </div>
                              ) : (xrefCache[verse.number] ?? []).length === 0 ? (
                                <p className="text-[10px] text-ink-muted m-0">No cross-references found.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(xrefCache[verse.number] ?? []).map(ref => (
                                    <a key={ref.href + ref.verse} href={`${ref.href}?t=${translation}#v${ref.verse}`}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-surface-overlay border border-line-subtle text-gold no-underline font-semibold">
                                      {ref.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Strong's row — KJV/NKJV only */}
                        {(translation === "KJV" || translation === "NKJV") && (
                          <div className="mt-1.5 pt-1.5 border-t border-line-subtle">
                            <button onClick={() => toggleStrongs(verse.number)} className="text-[10px] font-semibold text-gold-muted bg-transparent border-none cursor-pointer p-0 leading-none">
                              {strongsOpen === verse.number ? "▲ Hide Strong's" : "▼ Strong's"}
                            </button>
                            {strongsOpen === verse.number && (
                              <div className="mt-2">
                                {strongsLoading && !strongsCache[verse.number] && !strongsError[verse.number] ? (
                                  <p className="text-[10px] text-ink-muted m-0">Loading…</p>
                                ) : strongsError[verse.number] ? (
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-red-400 m-0">Couldn&apos;t load Strong&apos;s data.</p>
                                    <button onClick={() => fetchStrongs(verse.number)} className="text-[10px] text-gold-muted bg-transparent border-none cursor-pointer p-0 underline font-semibold">
                                      Retry
                                    </button>
                                  </div>
                                ) : (strongsCache[verse.number] ?? []).length === 0 ? (
                                  <p className="text-[10px] text-ink-muted m-0">No data for this verse.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {(strongsCache[verse.number] ?? []).map((w, i) => {
                                      const key = `${verse.number}-${i}`;
                                      const isActive = activeStrongsKey === key;
                                      return (
                                        <button key={key} onClick={() => setActiveStrongsKey(isActive ? null : key)}
                                          className={`flex flex-col items-start px-1.5 py-0.5 rounded text-left cursor-pointer border transition-colors ${isActive ? "border-gold bg-gold/[8%]" : "border-line-subtle bg-surface-overlay"}`}>
                                          <span className="text-[10px] text-ink-primary leading-tight">{w.word}</span>
                                          <span className="text-[9px] font-mono text-gold-muted">{w.strongs}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {activeStrongsKey && activeStrongsKey.startsWith(`${verse.number}-`) && (() => {
                                  const idx = parseInt(activeStrongsKey.split("-")[1], 10);
                                  const entry = strongsCache[verse.number]?.[idx];
                                  if (!entry) return null;
                                  return (
                                    <div className="mt-2 p-2 bg-surface-overlay border border-gold-muted/30 rounded-md">
                                      <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="text-[10px] font-mono text-gold">{entry.strongs}</span>
                                        {entry.lemma && <span className="text-[13px] font-semibold text-ink-primary">{entry.lemma}</span>}
                                      </div>
                                      {entry.xlit && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[9px] text-ink-muted uppercase tracking-wider font-semibold">pronounced</span>
                                          <span className="text-[12px] text-ink-secondary italic">{entry.xlit}</span>
                                        </div>
                                      )}
                                      {entry.def && <p className="text-[11px] text-ink-secondary mt-1 m-0 leading-snug">{entry.def}</p>}
                                      {entry.derivation && <p className="text-[10px] text-ink-muted mt-1 m-0 leading-snug">{renderDerivation(entry.derivation)}</p>}
                                      {linkedEntryLoading && <p className="text-[10px] text-ink-muted mt-1.5 m-0">Loading…</p>}
                                      {linkedEntry && !linkedEntryLoading && (
                                        <div className="mt-1.5 pt-1.5 border-t border-line-subtle/60">
                                          <div className="flex items-baseline gap-1.5 flex-wrap">
                                            <span className="text-[9px] font-mono text-gold">{linkedEntry.id}</span>
                                            {linkedEntry.lemma && <span className="text-[11px] font-semibold text-ink-primary">{linkedEntry.lemma}</span>}
                                            {linkedEntry.xlit && <span className="text-[9px] text-ink-muted italic">{linkedEntry.xlit}</span>}
                                          </div>
                                          {linkedEntry.def && <p className="text-[10px] text-ink-secondary mt-0.5 m-0 leading-snug">{linkedEntry.def}</p>}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => setStrongsModal(entry)}
                                        className="mt-2 text-[10px] text-gold bg-transparent border-none cursor-pointer p-0 font-semibold"
                                      >
                                        {concordanceCache[entry.strongs]
                                          ? `Full entry · ${concordanceCache[entry.strongs]!.count} uses →`
                                          : "Full entry →"}
                                      </button>
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

      {/* Map panel */}
      {mapOpen && mapPlaces.length > 0 && (
        <MapPanel places={mapPlaces} onClose={() => setMapOpen(false)} />
      )}

      {/* Notes panel */}
      {noteOpen && (
        <NotesPanel
          book={book}
          chapter={chapter}
          translation={translation}
          notes={notes}
          noteContents={noteContents}
          expandedVerse={expandedVerse}
          setExpandedVerse={setExpandedVerse}
          noteSaving={noteSaving}
          noteSavedVerse={noteSavedVerse}
          onChange={handleNoteChange}
          onSave={saveNote}
          onDelete={deleteNote}
          savedLabel={savedLabel}
          onClose={() => setNoteOpen(false)}
        />
      )}

      {/* Strong's full entry modal */}
      {strongsModal && (
        <StrongsModal
          modal={strongsModal}
          translation={translation}
          concordance={concordanceCache[strongsModal.strongs]}
          concordanceError={concordanceError[strongsModal.strongs]}
          concordanceLoading={concordanceLoading}
          onClose={() => setStrongsModal(null)}
          onRetry={() => fetchConcordance(strongsModal.strongs)}
          renderDerivation={renderDerivation}
        />
      )}
    </div>
  );
}
