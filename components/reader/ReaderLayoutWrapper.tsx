"use client";

import { useState } from "react";
import { Book, Translation, Chapter, Bookmark, Note, Highlight } from "@/types";
import ReaderLayout from "./ReaderLayout";
import ChapterView from "./ChapterView";

interface Props {
  book: Book;
  chapter: number;
  translation: Translation;
  user: { id: string; email?: string } | null;
  chapterData: Chapter | null;
  initialBookmark: Bookmark | null;
  initialNote: Note | null;
  initialHighlights: Highlight[];
  openNote?: boolean;
  bookmarkPositions?: Record<string, number>;
}

export default function ReaderLayoutWrapper({
  book, chapter, translation, user, chapterData, initialBookmark, initialNote, initialHighlights, openNote, bookmarkPositions = {}
}: Props) {
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);

  return (
    <ReaderLayout
      book={book}
      chapter={chapter}
      translation={translation}
      user={user}
      verses={verses}
      onHighlightVerse={setHighlightVerse}
      bookmarkPositions={bookmarkPositions}
    >
      <ChapterView
        book={book}
        chapter={chapter}
        translation={translation}
        chapterData={chapterData}
        user={user}
        initialBookmark={initialBookmark}
        initialNote={initialNote}
        initialHighlights={initialHighlights}
        openNote={openNote}
        onVersesReady={setVerses}
        externalHighlight={highlightVerse}
      />
    </ReaderLayout>
  );
}
