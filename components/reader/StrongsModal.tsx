"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { X as XIcon } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/books";
import { Translation } from "@/types";
import type { LexiconEntry, LexiconLine, RelatedWord } from "@/lib/strongs-lexicon";

const FOCUSABLE = 'button, a[href], [tabindex]:not([tabindex="-1"])';

export type StrongsModalData = {
  strongs: string;
  lemma: string;
  xlit?: string;
  def?: string;
  derivation?: string;
};

export type ConcordanceData = {
  count: number;
  verses: { b: number; c: number; v: number }[];
  kjvWords?: { word: string; count: number }[];
};

// Lexicon entries never change — keep them for the life of the page
const lexiconCache = new Map<string, LexiconEntry>();

const COLLAPSED_LINES = 8;
const FAMILY_PREVIEW = 12;

interface Props {
  modal: StrongsModalData;
  translation: Translation;
  concordance: ConcordanceData | null | undefined;
  concordanceError: string | undefined;
  concordanceLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  renderDerivation: (text: string) => ReactNode;
  onOpenStrongs: (id: string) => void;
}

export default function StrongsModal({
  modal, translation, concordance, concordanceError, concordanceLoading,
  onClose, onRetry, renderDerivation, onOpenStrongs,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [lexicon, setLexicon] = useState<LexiconEntry | null | undefined>(() => lexiconCache.get(modal.strongs));
  const [lexiconError, setLexiconError] = useState(false);
  const [lexiconAttempt, setLexiconAttempt] = useState(0);
  const [defExpanded, setDefExpanded] = useState(false);
  const [showAllKids, setShowAllKids] = useState(false);

  useEffect(() => {
    const id = modal.strongs;
    bodyRef.current?.scrollTo({ top: 0 });
    setDefExpanded(false);
    setShowAllKids(false);
    setLexiconError(false);
    const cached = lexiconCache.get(id);
    if (cached) { setLexicon(cached); return; }
    setLexicon(undefined);
    let cancelled = false;
    fetch(`/api/strongs/lexicon?id=${id}`)
      .then(res => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<LexiconEntry>;
      })
      .then(data => {
        if (cancelled) return;
        if (data) lexiconCache.set(id, data);
        setLexicon(data);
      })
      .catch(() => { if (!cancelled) setLexiconError(true); });
    return () => { cancelled = true; };
  }, [modal.strongs, lexiconAttempt]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="strongs-modal-title"
        className="relative w-full max-h-[88vh] bg-surface rounded-t-2xl flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-line-subtle shrink-0">
          <div>
            <span className="text-[11px] font-mono text-gold">{modal.strongs}</span>
            {modal.lemma && (
              <div id="strongs-modal-title" className="text-[24px] font-semibold text-ink-primary leading-tight mt-0.5">{modal.lemma}</div>
            )}
            {modal.xlit && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] text-ink-muted uppercase tracking-wider font-semibold">pronounced</span>
                <span className="text-[15px] text-ink-secondary italic">{modal.xlit}</span>
              </div>
            )}
            {(lexicon?.pos || lexicon?.gloss) && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {lexicon.pos && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-muted border border-line-subtle rounded-full px-2 py-0.5">
                    {lexicon.pos}
                  </span>
                )}
                {lexicon.gloss && <span className="text-[13px] text-ink-primary">“{lexicon.gloss}”</span>}
              </div>
            )}
          </div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Close" className="bg-transparent border-none cursor-pointer text-ink-muted p-1 mt-1 shrink-0">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {modal.def && (
            <div>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2 m-0">Definition</p>
              <p className="text-[14px] text-ink-secondary leading-[1.8] m-0">{modal.def}</p>
            </div>
          )}
          {modal.derivation && (
            <div>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2 m-0">Origin</p>
              <p className="text-[13px] text-ink-muted leading-[1.7] m-0">{renderDerivation(modal.derivation)}</p>
            </div>
          )}

          {/* Detailed lexicon entry */}
          {lexiconError ? (
            <div className="flex items-center gap-3">
              <p className="text-[13px] text-red-400 m-0">Couldn&apos;t load the lexicon entry.</p>
              <button onClick={() => setLexiconAttempt(n => n + 1)} className="text-[12px] text-gold-muted bg-transparent border-none cursor-pointer p-0 underline font-semibold">
                Retry
              </button>
            </div>
          ) : lexicon === undefined ? (
            <p className="text-[13px] text-ink-muted m-0">Loading lexicon…</p>
          ) : lexicon?.lines.length ? (() => {
            const lines = lexicon.lines;
            const collapsible = lines.length > COLLAPSED_LINES + 2;
            const shown = collapsible && !defExpanded ? lines.slice(0, COLLAPSED_LINES) : lines;
            return (
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2 m-0">
                  {lexicon.source === "bdb" ? "Brown-Driver-Briggs" : "Abbott-Smith"} lexicon
                </p>
                <div className={`relative flex flex-col gap-1.5 ${collapsible && !defExpanded ? "max-h-[22rem] overflow-hidden" : ""}`}>
                  {shown.map((line, i) => (
                    <LexiconLineView key={i} line={line} source={lexicon.source} translation={translation} onNavigate={onClose} />
                  ))}
                  {collapsible && !defExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface)] to-transparent pointer-events-none" />
                  )}
                </div>
                {collapsible && (
                  <button
                    onClick={() => setDefExpanded(v => !v)}
                    className="mt-2 text-[12px] text-gold-muted bg-transparent border-none cursor-pointer p-0 underline font-semibold"
                  >
                    {defExpanded ? "Show less" : "Show full entry"}
                  </button>
                )}
                <p className="text-[10px] text-ink-muted mt-3 mb-0 leading-[1.6]">
                  {lexicon.source === "bdb" ? (
                    <>Brown-Driver-Briggs from the <a href="https://hb.openscriptures.org" target="_blank" rel="noopener noreferrer" className="text-ink-muted underline">Open Scriptures Hebrew Bible</a> project; gloss from <a href="https://www.STEPBible.org" target="_blank" rel="noopener noreferrer" className="text-ink-muted underline">STEP Bible</a>. CC BY 4.0.</>
                  ) : (
                    <>Abbott-Smith, <i>Manual Greek Lexicon of the New Testament</i>, via <a href="https://www.STEPBible.org" target="_blank" rel="noopener noreferrer" className="text-ink-muted underline">STEP Bible</a>. CC BY 4.0.</>
                  )}
                </p>
              </div>
            );
          })() : null}

          {/* Word family */}
          {lexicon && (lexicon.family.from.length > 0 || lexicon.family.kids.length > 0 || lexicon.family.siblings.length > 0) && (
            <div>
              <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2 m-0">Word family</p>
              <div className="flex flex-col gap-3">
                {lexicon.family.from.length > 0 && (
                  <FamilyRow label="Comes from" words={lexicon.family.from} onOpen={onOpenStrongs} />
                )}
                {lexicon.family.kids.length > 0 && (
                  <FamilyRow
                    label="Words formed from it"
                    words={showAllKids ? lexicon.family.kids : lexicon.family.kids.slice(0, FAMILY_PREVIEW)}
                    onOpen={onOpenStrongs}
                    more={!showAllKids && lexicon.family.kids.length > FAMILY_PREVIEW
                      ? { count: lexicon.family.kids.length - FAMILY_PREVIEW, onClick: () => setShowAllKids(true) }
                      : undefined}
                  />
                )}
                {lexicon.family.siblings.length > 0 && (
                  <FamilyRow label="Same root" words={lexicon.family.siblings} onOpen={onOpenStrongs} />
                )}
              </div>
            </div>
          )}

          {/* Translated as — bar chart */}
          {concordance?.kjvWords?.length ? (() => {
            const words = concordance.kjvWords!;
            const max = words[0].count;
            return (
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2 m-0">Translated as</p>
                <div className="flex flex-col gap-1.5">
                  {words.map(({ word, count }) => (
                    <div key={word} className="flex items-center gap-2">
                      <span className="text-[13px] text-ink-primary w-28 shrink-0 capitalize">{word}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round((count / max) * 100)}%`, backgroundColor: 'var(--gold)' }}
                        />
                      </div>
                      <span className="text-[11px] text-ink-muted w-8 text-right shrink-0">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : null}

          {/* Concordance verse list */}
          {(() => {
            if (concordanceError) {
              return (
                <div className="flex items-center gap-3">
                  <p className="text-[13px] text-red-400 m-0">Couldn&apos;t load concordance data.</p>
                  <button onClick={onRetry} className="text-[12px] text-gold-muted bg-transparent border-none cursor-pointer p-0 underline font-semibold">
                    Retry
                  </button>
                </div>
              );
            }
            if (concordanceLoading && concordance === undefined) {
              return <p className="text-[13px] text-ink-muted m-0">Loading uses…</p>;
            }
            if (!concordance?.verses?.length) return null;
            return (
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-2 m-0">
                  Used {concordance.count} {concordance.count === 1 ? "time" : "times"} in the Bible
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[...concordance.verses].sort((a, b) => a.b - b.b || a.c - b.c || a.v - b.v).map((ref, i) => {
                    const bk = BIBLE_BOOKS[ref.b - 1];
                    if (!bk) return null;
                    return (
                      <a
                        key={i}
                        href={`/bible/${bk.id}/${ref.c}?t=${translation}#v${ref.v}`}
                        onClick={onClose}
                        className="text-[11px] px-2 py-1 rounded-md bg-surface-raised border border-line-subtle text-ink-secondary no-underline hover:border-gold-muted transition-colors"
                      >
                        {bk.abbreviation} {ref.c}:{ref.v}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="h-4 shrink-0" />
        </div>
      </div>
    </div>
  );
}

function refLabel(seg: { t: string; r?: string }, source: LexiconEntry["source"]): string {
  // BDB's own ref text is terse ("ψ 9:7", "v. 28"), so rebuild it from the key
  if (source === "bdb" && seg.r) {
    const [bookId, c, v] = seg.r.split(".");
    const bk = BIBLE_BOOKS.find(b => b.id === bookId);
    if (bk) return `${bk.abbreviation} ${c}:${v}`;
  }
  return seg.t.replace(/^([1-4]?[A-Za-z]+)\.(?=\d)/, "$1 ").replace(/[;,.]+$/, "");
}

function LexiconLineView({ line, source, translation, onNavigate }: {
  line: LexiconLine;
  source: LexiconEntry["source"];
  translation: Translation;
  onNavigate: () => void;
}) {
  return (
    <p className="text-[13px] text-ink-secondary leading-[1.7] m-0" style={{ paddingLeft: line.d * 14 }}>
      {line.s.map((seg, i) => {
        if (seg.r) {
          const [bookId, c, v] = seg.r.split(".");
          return (
            <a
              key={i}
              href={`/bible/${bookId}/${c}?t=${translation}#v${v}`}
              onClick={onNavigate}
              className="text-gold-muted no-underline hover:text-gold whitespace-nowrap"
            >
              {refLabel(seg, source)}
            </a>
          );
        }
        const cls = `${seg.b ? "font-semibold text-ink-primary" : ""} ${seg.i ? "italic" : ""}`.trim();
        return cls ? <span key={i} className={cls}>{seg.t}</span> : <span key={i}>{seg.t}</span>;
      })}
    </p>
  );
}

function FamilyRow({ label, words, onOpen, more }: {
  label: string;
  words: RelatedWord[];
  onOpen: (id: string) => void;
  more?: { count: number; onClick: () => void };
}) {
  return (
    <div>
      <p className="text-[11px] text-ink-muted m-0 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {words.map(w => (
          <button
            key={w.id}
            onClick={() => onOpen(w.id)}
            className="flex items-baseline gap-1.5 text-left px-2 py-1 rounded-md bg-surface-raised border border-line-subtle cursor-pointer hover:border-gold-muted transition-colors"
          >
            <span className="text-[9px] font-mono text-gold-muted">{w.id}</span>
            <span className="text-[13px] text-ink-primary">{w.lemma}</span>
            {w.gloss && <span className="text-[11px] text-ink-muted">{w.gloss}</span>}
          </button>
        ))}
        {more && (
          <button
            onClick={more.onClick}
            className="text-[11px] px-2 py-1 rounded-md bg-transparent border border-dashed border-line-subtle text-gold-muted cursor-pointer"
          >
            +{more.count} more
          </button>
        )}
      </div>
    </div>
  );
}
