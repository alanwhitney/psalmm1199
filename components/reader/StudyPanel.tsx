"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { BookOpenText, ChevronDown, ChevronRight } from "lucide-react";
import { Book } from "@/types";
import {
  COMMENTARY_SOURCES, CommentaryChapter, CommentaryPara, CommentarySeg, CommentarySource,
} from "@/lib/commentary";

const SOURCE_KEY = "study-source";

// Keyed by `${source}:${book}:${chapter}` (chapters) or `${source}:${book}:intro`
const cache = new Map<string, CommentaryChapter | CommentaryPara[] | "missing">();

function chapterUrl(source: CommentarySource, bookId: string, chapter: number) {
  return source === "spurgeon"
    ? `/commentary/spurgeon/${chapter}.json`
    : `/api/commentary?source=${source}&book=${bookId}&chapter=${chapter}`;
}

function verseLabel([start, end]: [number, number]) {
  if (end >= 999) return `v. ${start}ff`;
  return start === end ? `v. ${start}` : `vv. ${start}–${end}`;
}

function Segs({ segs }: { segs: CommentarySeg[] }) {
  return (
    <>
      {segs.map((s, i) => {
        const text = s.t.includes("\n")
          ? s.t.split("\n").map((l, j) => <Fragment key={j}>{j > 0 && <br />}{l}</Fragment>)
          : s.t;
        if (s.b && s.i) return <strong key={i}><em>{text}</em></strong>;
        if (s.b) return <strong key={i} className="text-ink-primary font-semibold">{text}</strong>;
        if (s.i) return <em key={i}>{text}</em>;
        return <Fragment key={i}>{text}</Fragment>;
      })}
    </>
  );
}

function VerseChip({ v, onClick }: { v: [number, number]; onClick: (verse: number) => void }) {
  return (
    <button
      onClick={() => onClick(v[0])}
      className="text-[10px] font-bold text-gold bg-gold/[8%] border-none rounded px-1.5 py-0.5 cursor-pointer"
    >
      {verseLabel(v)}
    </button>
  );
}

export default function StudyPanel({
  book, chapter, selectedVerse, onVerseClick, onClose,
}: {
  book: Book;
  chapter: number;
  selectedVerse: number | null;
  onVerseClick: (verse: number) => void;
  onClose: () => void;
}) {
  const sources = COMMENTARY_SOURCES.filter((s) => !s.books || s.books.includes(book.id));
  const [source, setSource] = useState<CommentarySource>(() => {
    try {
      const saved = localStorage.getItem(SOURCE_KEY) as CommentarySource | null;
      if (saved && sources.some((s) => s.id === saved)) return saved;
    } catch {}
    return sources[0].id;
  });
  // Spurgeon only covers Psalms; fall back when moving to another book
  const active = sources.some((s) => s.id === source) ? source : sources[0].id;
  const meta = COMMENTARY_SOURCES.find((s) => s.id === active)!;

  const chapterKey = `${active}:${book.id}:${chapter}`;
  const introKey = `${active}:${book.id}:intro`;
  const [, forceRender] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [introError, setIntroError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function pickSource(id: CommentarySource) {
    setSource(id);
    try { localStorage.setItem(SOURCE_KEY, id); } catch {}
  }

  async function load(key: string, url: string): Promise<boolean> {
    try {
      const res = await fetch(url);
      if (res.status === 404) { cache.set(key, "missing"); return true; }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      cache.set(key, data.intro ?? data);
      return true;
    } catch {
      return false;
    } finally {
      forceRender((n) => n + 1);
    }
  }

  function loadChapter() {
    setError(null);
    load(chapterKey, chapterUrl(active, book.id, chapter)).then((ok) => {
      if (!ok) setError("Couldn't load commentary.");
    });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setIntroOpen(false);
    if (!cache.has(chapterKey)) loadChapter();
    else setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterKey]);

  function toggleIntro() {
    setIntroOpen((o) => !o);
    if (!cache.has(introKey)) {
      setIntroError(false);
      load(introKey, `/api/commentary?source=${active}&book=${book.id}&chapter=${chapter}&intro=1`).then((ok) => setIntroError(!ok));
    }
  }

  const data = cache.get(chapterKey);
  const chapterData = data && data !== "missing" ? (data as CommentaryChapter) : null;
  const intro = cache.get(introKey);

  // Follow the reader: when a verse is selected, scroll to the first note on it
  useEffect(() => {
    if (selectedVerse == null || !chapterData || !scrollRef.current) return;
    const container = scrollRef.current;
    const target = [...container.querySelectorAll<HTMLElement>("[data-vs]")].find(
      (el) => Number(el.dataset.vs) <= selectedVerse && selectedVerse <= Number(el.dataset.ve)
    );
    if (target) {
      // offsetTop is relative to the container, which is position: relative
      container.scrollTo({ top: target.offsetTop - 8, behavior: "smooth" });
    }
  }, [selectedVerse, chapterData]);

  return (
    <div className="absolute inset-0 z-20 lg:static lg:inset-auto lg:z-auto lg:w-96 xl:w-[440px] 2xl:w-[520px] border-t lg:border-t-0 lg:border-l border-line-subtle bg-surface-raised flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpenText size={13} className="text-ink-muted" />
          <h3 className="text-[13px] font-semibold text-ink-primary m-0">Study — {book.name} {chapter}</h3>
        </div>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted text-lg leading-none p-0">×</button>
      </div>

      {/* Source tabs */}
      <div className="px-3 py-2 border-b border-line-subtle shrink-0 flex gap-1.5">
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => pickSource(s.id)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer border ${active === s.id ? "border-gold-muted bg-gold/[9%] text-gold" : "border-line-subtle bg-surface-overlay text-ink-secondary"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 relative">
        {active !== "spurgeon" && data !== "missing" && (
          <div className="mb-3">
            <button onClick={toggleIntro} className="flex items-center gap-1 text-[11px] font-semibold text-gold-muted bg-transparent border-none cursor-pointer p-0">
              {introOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Introduction to {book.name}
            </button>
            {introOpen && (
              <div className="mt-2 pl-3 border-l-2 border-line-subtle">
                {introError ? (
                  <p className="text-[11px] text-red-400 m-0">Couldn&apos;t load the introduction.</p>
                ) : !intro ? (
                  <p className="text-[11px] text-ink-muted m-0">Loading…</p>
                ) : intro === "missing" || (intro as CommentaryPara[]).length === 0 ? (
                  <p className="text-[11px] text-ink-muted m-0">No introduction for this book.</p>
                ) : (
                  (intro as CommentaryPara[]).map((p, i) =>
                    p.h ? (
                      <h4 key={i} className="text-[12px] font-semibold text-ink-primary mt-3 mb-1">{p.s[0]?.t}</h4>
                    ) : (
                      <p key={i} className="text-[13px] leading-relaxed text-ink-secondary mt-0 mb-2"><Segs segs={p.s} /></p>
                    )
                  )
                )}
              </div>
            )}
          </div>
        )}

        {error ? (
          <div className="flex items-center gap-2">
            <p className="text-[12px] text-red-400 m-0">{error}</p>
            <button onClick={loadChapter} className="text-[12px] text-gold-muted bg-transparent border-none cursor-pointer p-0 underline font-semibold">Retry</button>
          </div>
        ) : !data ? (
          <p className="text-[12px] text-ink-muted m-0">Loading…</p>
        ) : data === "missing" ? (
          <p className="text-[12px] text-ink-muted m-0">{meta.label} has no notes for {book.name}.</p>
        ) : chapterData!.sections.length === 0 ? (
          <p className="text-[12px] text-ink-muted m-0">No notes for this chapter.</p>
        ) : (
          chapterData!.sections.map((sec, si) => {
            let lastV: string | null = sec.v ? sec.v.join("-") : null;
            return (
              <section
                key={si}
                className="mb-4"
                {...(sec.v ? { "data-vs": sec.v[0], "data-ve": sec.v[1] } : {})}
              >
                {(sec.h || sec.v) && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {sec.v && <VerseChip v={sec.v} onClick={onVerseClick} />}
                    {sec.h && <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-gold-muted m-0">{sec.h}</h4>}
                  </div>
                )}
                {sec.p.map((p, pi) => {
                  const key = p.v ? p.v.join("-") : null;
                  const showChip = !sec.v && p.v && key !== lastV;
                  lastV = key;
                  return (
                    <div key={pi} {...(!sec.v && p.v ? { "data-vs": p.v[0], "data-ve": p.v[1] } : {})}>
                      {showChip && <div className="mt-2 mb-1"><VerseChip v={p.v!} onClick={onVerseClick} /></div>}
                      <p className="text-[13px] leading-relaxed text-ink-secondary mt-0 mb-2"><Segs segs={p.s} /></p>
                    </div>
                  );
                })}
              </section>
            );
          })
        )}
      </div>

      {/* Attribution */}
      <div className="px-3 py-1.5 border-t border-line-subtle shrink-0">
        <p className="text-[9px] text-ink-muted m-0">
          <a href={meta.credit.href} target="_blank" rel="noopener noreferrer" className="text-gold-muted no-underline">{meta.credit.text}</a>
          {meta.credit.license && (
            <>
              {" · "}
              <a href={meta.credit.license.href} target="_blank" rel="noopener noreferrer" className="text-gold-muted no-underline">{meta.credit.license.text}</a>
            </>
          )}
          {active !== "spurgeon" && (
            <>
              {" · via "}
              <a href="https://bible.helloao.org" target="_blank" rel="noopener noreferrer" className="text-gold-muted no-underline">Free Use Bible API</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
