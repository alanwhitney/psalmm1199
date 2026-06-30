"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X as XIcon } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/books";
import { Translation } from "@/types";

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

interface Props {
  modal: StrongsModalData;
  translation: Translation;
  concordance: ConcordanceData | null | undefined;
  concordanceError: string | undefined;
  concordanceLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  renderDerivation: (text: string) => ReactNode;
}

export default function StrongsModal({
  modal, translation, concordance, concordanceError, concordanceLoading,
  onClose, onRetry, renderDerivation,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
          </div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Close" className="bg-transparent border-none cursor-pointer text-ink-muted p-1 mt-1 shrink-0">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
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
