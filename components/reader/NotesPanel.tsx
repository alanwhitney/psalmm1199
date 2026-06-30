"use client";

import { StickyNote, Trash2, ChevronRight } from "lucide-react";
import { Book, Note, Translation } from "@/types";
import { detectBibleRefs } from "@/lib/bible-refs";

interface Props {
  book: Book;
  chapter: number;
  translation: Translation;
  notes: Note[];
  noteContents: Record<number, string>;
  expandedVerse: number | null;
  setExpandedVerse: (v: number | null) => void;
  noteSaving: boolean;
  noteSavedVerse: number | null;
  onChange: (verseNum: number, value: string) => void;
  onSave: (verseNum: number, content: string) => void;
  onDelete: (noteId: string, verseNum: number) => void;
  savedLabel: (verseNum: number) => string;
  onClose: () => void;
}

export default function NotesPanel({
  book, chapter, translation, notes, noteContents,
  expandedVerse, setExpandedVerse, noteSaving, noteSavedVerse,
  onChange, onSave, onDelete, savedLabel, onClose,
}: Props) {
  const noteVerses = Array.from(new Set([
    ...notes.map(n => n.verse),
    ...Object.keys(noteContents).map(Number),
  ])).sort((a, b) => a - b);

  return (
    <div className="absolute inset-0 z-20 lg:static lg:inset-auto lg:z-auto lg:w-80 xl:w-96 2xl:w-[440px] border-t lg:border-t-0 lg:border-l border-line-subtle bg-surface-raised flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-b-line-subtle flex items-center justify-between shrink-0">
        <h3 className="text-[13px] font-semibold text-ink-primary m-0">Notes — {book.name} {chapter}</h3>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted text-lg leading-none p-0">×</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {noteVerses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
            <StickyNote size={24} className="text-ink-muted mb-3" />
            <p className="text-[13px] text-ink-muted leading-relaxed">Tap any verse then &ldquo;Add note&rdquo; to start</p>
          </div>
        ) : (
          <div className="divide-y divide-line-subtle">
            {noteVerses.map(verseNum => {
              const savedNote = notes.find(n => n.verse === verseNum);
              const content = noteContents[verseNum] ?? "";
              const isExpanded = expandedVerse === verseNum;
              const refs = isExpanded && content.trim() ? detectBibleRefs(content, translation) : [];
              return (
                <div key={verseNum}>
                  <button
                    onClick={() => setExpandedVerse(isExpanded ? null : verseNum)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-transparent border-none cursor-pointer text-left"
                  >
                    <span className="text-[11px] font-bold text-gold shrink-0">v.{verseNum}</span>
                    {!isExpanded && (
                      <span className="text-[11px] text-ink-muted truncate flex-1 italic">
                        {content ? (content.length > 50 ? content.slice(0, 50) + "…" : content) : "Empty"}
                      </span>
                    )}
                    <ChevronRight size={11} className="text-ink-muted shrink-0 ml-auto" style={{ transform: isExpanded ? "rotate(90deg)" : undefined, transition: "transform 0.15s" }} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <textarea
                        autoFocus
                        className="w-full bg-surface-overlay text-ink-primary text-[13px] p-3 resize-y border border-line-subtle rounded-lg outline-none leading-[1.7] font-[inherit] min-h-[120px] xl:min-h-[180px] 2xl:min-h-[220px]"
                        placeholder={`Note for verse ${verseNum}…`}
                        value={content}
                        onChange={(e) => onChange(verseNum, e.target.value)}
                      />
                      {refs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {refs.map(ref => (
                            <a key={ref.href} href={ref.href} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-overlay border border-line-subtle text-gold no-underline font-semibold">
                              {ref.label}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {savedNote && (
                            <button onClick={() => onDelete(savedNote.id, verseNum)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1 flex" title="Delete note">
                              <Trash2 size={13} />
                            </button>
                          )}
                          {savedNote?.updated_at && (
                            <span className="text-[11px] text-ink-muted">{savedLabel(verseNum)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => onSave(verseNum, content)}
                          disabled={noteSaving}
                          className={`px-[14px] py-1.5 bg-gold text-surface text-xs font-bold rounded-md border-none ${noteSaving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {noteSaving ? "Saving…" : noteSavedVerse === verseNum ? "Saved ✓" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
