"use client";

import { useEffect, useState } from "react";
import { Translation } from "@/types";

const HISTORY_KEY = "psalm1199-recent-chapters";

export interface RecentChapter {
  bookId: string;
  bookName: string;
  chapter: number;
  translation: Translation;
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
      const raw = localStorage.getItem(HISTORY_KEY);
      const list: RecentChapter[] = raw ? JSON.parse(raw) : [];
      if (bookId && bookName && chapter != null && translation) {
        const rest = list.filter((e) => !(e.bookId === bookId && e.chapter === chapter));
        const updated = [{ bookId, bookName, chapter, translation }, ...rest].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        setHistory(updated);
      } else {
        setHistory(list);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — history just won't persist
    }
  }, [bookId, bookName, chapter, translation]);

  return history;
}
