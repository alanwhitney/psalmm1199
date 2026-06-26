"use client";

import { useState } from "react";
import { Book, Translation, Chapter, Bookmark, Note, Highlight } from "@/types";
import ReaderLayout from "./ReaderLayout";
import ChapterView from "./ChapterView";
import { MapPlace } from "@/lib/chapter-places";

interface Props {
  book: Book;
  chapter: number;
  translation: Translation;
  user: { id: string; email?: string } | null;
  chapterData: Chapter | null;
  initialBookmark: Bookmark | null;
  initialNotes: Note[];
  initialHighlights: Highlight[];
  openNote?: boolean;
  bookmarkPositions?: Record<string, number>;
  noteChapters?: Record<string, number[]>;
  backHref?: string;
  backLabel?: string;
  mapPlaces?: MapPlace[];
}

export default function ReaderLayoutWrapper({
  book, chapter, translation, user, chapterData, initialBookmark, initialNotes, initialHighlights, openNote, bookmarkPositions = {}, noteChapters = {}, backHref, backLabel, mapPlaces = []
}: Props) {
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState(openNote ?? false);

  const backHrefWithNote = backHref
    ? `${backHref}${noteOpen ? `${backHref.includes("?") ? "&" : "?"}note=1` : ""}`
    : undefined;

  return (
    <ReaderLayout
      book={book}
      chapter={chapter}
      translation={translation}
      user={user}
      verses={verses}
      onHighlightVerse={setHighlightVerse}
      bookmarkPositions={bookmarkPositions}
      noteChapters={noteChapters}
      backHref={backHrefWithNote}
      backLabel={backLabel}
    >
      <ChapterView
        book={book}
        chapter={chapter}
        translation={translation}
        chapterData={chapterData}
        user={user}
        initialBookmark={initialBookmark}
        initialNotes={initialNotes}
        initialHighlights={initialHighlights}
        openNote={openNote}
        onNoteOpenChange={setNoteOpen}
        onVersesReady={setVerses}
        externalHighlight={highlightVerse}
        mapPlaces={mapPlaces}
      />
    </ReaderLayout>
  );
}
