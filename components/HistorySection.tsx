"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Translation } from "@/types";
import { RecentChapter } from "@/hooks/useRecentChapters";

interface Props {
  history: RecentChapter[];
  activeBookId?: string;
  activeChapter?: number;
  onSelect: (bookId: string, chapter: number, translation: Translation, verse?: number) => void;
}

export default function HistorySection({ history, activeBookId, activeChapter, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-b-line-subtle">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer"
      >
        <p className="text-[10px] uppercase tracking-[0.1em] text-ink-muted font-semibold m-0">History</p>
        <ChevronRight size={12} className="text-ink-muted transition-transform" style={{ transform: open ? "rotate(90deg)" : undefined }} />
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          {history.length === 0 && (
            <p className="text-[11px] text-ink-muted m-0">No chapters viewed yet.</p>
          )}
          {history.map((h) => {
            const active = h.bookId === activeBookId && h.chapter === activeChapter;
            return (
              <button
                key={`${h.bookId}-${h.chapter}`}
                onClick={() => onSelect(h.bookId, h.chapter, h.translation, h.verse)}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-[12px] rounded-md cursor-pointer border-none ${
                  active ? "bg-gold text-surface font-semibold" : "bg-surface-overlay text-ink-secondary"
                }`}
              >
                <span>{h.bookName} {h.chapter}{h.verse ? `:${h.verse}` : ""}</span>
                <span className={`text-[10px] font-bold ${active ? "text-surface" : "text-ink-muted"}`}>{h.translation}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
