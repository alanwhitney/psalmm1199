"use client";

import { useState } from "react";
import { Book, Translation, Chapter, Bookmark, Note } from "@/types";
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
  openNote?: boolean;
}

export default function ReaderLayoutWrapper({
  book, chapter, translation, user, chapterData, initialBookmark, initialNote, openNote
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
    >
      <ChapterView
        book={book}
        chapter={chapter}
        translation={translation}
        chapterData={chapterData}
        user={user}
        initialBookmark={initialBookmark}
        initialNote={initialNote}
        openNote={openNote}
        onVersesReady={setVerses}
        externalHighlight={highlightVerse}
      />
    </ReaderLayout>
  );
}
