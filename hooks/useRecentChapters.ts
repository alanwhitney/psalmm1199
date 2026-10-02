"use client";

import { useEffect, useState } from "react";
import { Translation } from "@/types";

const HISTORY_KEY = "psalm1199-recent-chapters";
const HISTORY_EVENT = "psalm1199-history-change";

export interface RecentChapter {
  bookId: string;
  bookName: string;
  chapter: number;
  translation: Translation;
  verse?: number; // last verse the user selected in this chapter
}

function readHistory(): RecentChapter[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Remember the verse the user selected, so History reopens the chapter on it. */
export function recordRecentVerse(bookId: string, chapter: number, verse: number) {
  try {
    const list = readHistory();
    const entry = list.find((e) => e.bookId === bookId && e.chapter === chapter);
    if (!entry || entry.verse === verse) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.map((e) => (e === entry ? { ...e, verse } : e))));
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — history just won't persist
  }
}

/**
 * Reads the recently-viewed-chapters list from localStorage.
 * Pass `current` from the chapter reader to also record a visit; omit it
 * elsewhere (e.g. AppLayout) to just read the list without writing to it.
 */
export function useRecentChapters(current?: RecentChapter): RecentChapter[] {
  const [history, setHistory] = useState<RecentChapter[]>([]);
  const { bookId, bookName, chapter, translation } = current ?? {};

  useEffect(() => {
    try {
      const list = readHistory();
      if (bookId && bookName && chapter != null && translation) {
        const prev = list.find((e) => e.bookId === bookId && e.chapter === chapter);
        const rest = list.filter((e) => e !== prev);
        const updated = [{ bookId, bookName, chapter, translation, verse: prev?.verse }, ...rest].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        setHistory(updated);
      } else {
        setHistory(list);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — history just won't persist
    }
  }, [bookId, bookName, chapter, translation]);

  // Pick up verse selections recorded by ChapterView
  useEffect(() => {
    const sync = () => { try { setHistory(readHistory()); } catch {} };
    window.addEventListener(HISTORY_EVENT, sync);
    return () => window.removeEventListener(HISTORY_EVENT, sync);
  }, []);

  return history;
}
