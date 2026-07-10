"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";
import { Book, Translation, Chapter } from "@/types";
import { renderWjText } from "./wj-render";
import { useTheme } from "@/components/ThemeProvider";

const SCROLL_SAVE_DEBOUNCE = 300;

const REDLETTER_TRANSLATIONS: Translation[] = ["KJV", "NIV"];

interface Props {
  book: Book;
  chapter: number;
  primaryTranslation: Translation;
  compareTranslation: Translation;
  primaryData: Chapter | null;
  compareData: Chapter | null;
}

export default function CompareView({
  book, chapter, primaryTranslation, compareTranslation, primaryData, compareData,
}: Props) {
  const { showSections } = useTheme();
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readProgress, setReadProgress] = useState(0);

  const scrollKey = `scroll:compare:${book.id}:${chapter}`;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(scrollKey);
    if (saved) el.scrollTop = parseInt(saved, 10);
  }, [scrollKey]);

  useEffect(() => {
    document.cookie = `last_position=${book.id}:${chapter}:${primaryTranslation};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, [book.id, chapter, primaryTranslation]);

  const exitHref = `/bible/${book.id}/${chapter}?t=${primaryTranslation}`;
  const prevHref = prevChapter ? `/bible/${book.id}/${prevChapter}?t=${primaryTranslation}&compare=${compareTranslation}` : null;
  const nextHref = nextChapter ? `/bible/${book.id}/${nextChapter}?t=${primaryTranslation}&compare=${compareTranslation}` : null;

  if (!primaryData || !compareData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-20 px-6 text-ink-secondary">
        <AlertCircle size={32} className="text-ink-muted" />
        <div className="text-center">
          <p className="font-semibold mb-1 text-ink-primary">Couldn&apos;t load one of the translations</p>
          <p className="text-[13px] text-ink-muted">
            {!primaryData && `${primaryTranslation} `}
            {!primaryData && !compareData && "and "}
            {!compareData && `${compareTranslation} `}
            failed to load.
          </p>
        </div>
        <Link href={exitHref} className="text-xs text-gold no-underline">Exit compare →</Link>
      </div>
    );
  }

  const primaryVerseMap = new Map(primaryData.verses.map(v => [v.number, v.text]));
  const compareVerseMap = new Map(compareData.verses.map(v => [v.number, v.text]));
  const allVerseNumbers = Array.from(
    new Set([...primaryVerseMap.keys(), ...compareVerseMap.keys()])
  ).sort((a, b) => a - b);

  const primaryRedLetter = REDLETTER_TRANSLATIONS.includes(primaryTranslation);
  const compareRedLetter = REDLETTER_TRANSLATIONS.includes(compareTranslation);

  return (
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
        <div className="max-w-[1100px] mx-auto py-12 px-6 md:px-8">

          {/* Chapter heading */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-light mb-1 text-ink-primary font-reading">{book.name} {chapter}</h2>
              <p className="text-xs text-ink-muted">
                Comparing <span className="text-gold font-semibold">{primaryTranslation}</span> with <span className="text-gold font-semibold">{compareTranslation}</span>
              </p>
            </div>
            <Link href={exitHref} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-line-subtle bg-surface-raised text-ink-secondary no-underline shrink-0">
              <X size={13} /> Exit compare
            </Link>
          </div>
          <div className="h-px mb-8 bg-gradient-to-r from-transparent via-gold-muted to-transparent" />

          {/* Column headers — desktop only */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-x-8 mb-4">
            <h3 className="text-[11px] font-bold text-gold-muted uppercase tracking-[0.12em] m-0">{primaryTranslation}</h3>
            <h3 className="text-[11px] font-bold text-gold-muted uppercase tracking-[0.12em] m-0">{compareTranslation}</h3>
          </div>

          {/* Comparison body */}
          <div
            className="font-reading leading-loose text-ink-primary md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-1"
            style={{ fontSize: "var(--reading-font-size, 17px)" }}
          >
            {allVerseNumbers.map((n) => {
              const primaryText = primaryVerseMap.get(n) ?? "";
              const compareText = compareVerseMap.get(n) ?? "";
              const primaryHeading = showSections ? primaryData.headings?.[n] : null;
              const compareHeading = showSections ? compareData.headings?.[n] : null;
              return (
                <Fragment key={n}>
                  <div className="mb-4 md:mb-1">
                    {primaryHeading && <h3 className="section-heading">{primaryHeading}</h3>}
                    <span className="text-[10px] font-bold text-gold-muted uppercase tracking-widest md:hidden">
                      {primaryTranslation}
                    </span>
                    <Link
                      href={`/bible/${book.id}/${chapter}?t=${primaryTranslation}#v${n}`}
                      title={`Open ${primaryTranslation} ${book.name} ${chapter}:${n}`}
                      className={`block m-0 px-1 py-1 rounded-md no-underline text-ink-primary transition-colors hover:bg-gold/[6%] ${primaryRedLetter ? "red-letter" : ""}`}
                    >
                      <sup className="text-[10px] font-bold mr-[3px] font-sans align-super select-none text-gold-muted">
                        {n}
                      </sup>
                      {primaryText ? renderWjText(primaryText) : <span className="text-ink-muted italic">—</span>}
                    </Link>
                  </div>
                  <div className="mb-8 md:mb-1">
                    {compareHeading && <h3 className="section-heading">{compareHeading}</h3>}
                    <span className="text-[10px] font-bold text-gold-muted uppercase tracking-widest md:hidden">
                      {compareTranslation}
                    </span>
                    <Link
                      href={`/bible/${book.id}/${chapter}?t=${compareTranslation}#v${n}`}
                      title={`Open ${compareTranslation} ${book.name} ${chapter}:${n}`}
                      className={`block m-0 px-1 py-1 rounded-md no-underline text-ink-primary transition-colors hover:bg-gold/[6%] ${compareRedLetter ? "red-letter" : ""}`}
                    >
                      <sup className="text-[10px] font-bold mr-[3px] font-sans align-super select-none text-gold-muted">
                        {n}
                      </sup>
                      {compareText ? renderWjText(compareText) : <span className="text-ink-muted italic">—</span>}
                    </Link>
                  </div>
                </Fragment>
              );
            })}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex justify-between items-center mt-16 pt-6 border-t border-t-line-subtle">
            {prevHref ? (
              <a href={prevHref} className="flex items-center gap-1.5 text-[13px] text-ink-secondary no-underline">
                <ChevronLeft size={16} /> Chapter {prevChapter}
              </a>
            ) : <span />}
            {nextHref ? (
              <a href={nextHref} className="flex items-center gap-1.5 text-[13px] text-ink-secondary no-underline">
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
  );
}
