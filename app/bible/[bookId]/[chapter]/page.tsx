import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { fetchChapter } from "@/lib/bible-api";
import { BOOK_BY_ID } from "@/lib/books";
import { Translation, Highlight, Note, TRANSLATIONS } from "@/types";
import ReaderLayoutWrapper from "@/components/reader/ReaderLayoutWrapper";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { lastPositionUrl, lastPositionLabel } from "@/lib/last-position";

interface PageProps {
  params: Promise<{ bookId: string; chapter: string }>;
  searchParams: Promise<{ t?: string; note?: string }>;
}

export default async function BiblePage({ params, searchParams }: PageProps) {
  const { bookId, chapter: chapterStr } = await params;
  const { t, note: noteParam } = await searchParams;

  const book = BOOK_BY_ID[bookId.toUpperCase()];
  if (!book) return notFound();

  const chapterNum = parseInt(chapterStr, 10);
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > book.chapters) {
    return notFound();
  }

  const translation: Translation =
    (TRANSLATIONS as string[]).includes(t as string) ? (t as Translation) : "NKJV";

  let chapterData;
  try {
    chapterData = await fetchChapter(bookId.toUpperCase(), chapterNum, translation);
  } catch {
    chapterData = null;
  }

  const cookieStore = await cookies();
  const lastPos = cookieStore.get("last_position")?.value;
  const [lastBookId, lastChapter] = (lastPos ?? "").split(":");
  const isDifferentChapter = lastBookId !== bookId.toUpperCase() || lastChapter !== String(chapterNum);
  const backHref = isDifferentChapter ? lastPositionUrl(lastPos) : undefined;
  const backLabel = isDifferentChapter ? lastPositionLabel(lastPos) : undefined;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let bookmark = null;
  let initialNotes: Note[] = [];
  let highlights: Highlight[] = [];

  let bookmarkPositions: Record<string, number> = {};
  let noteChapters: Record<string, number[]> = {};

  if (user) {
    const [{ data: bm }, { data: nt }, { data: hl }, { data: allBookmarks }, { data: allNotes }] = await Promise.all([
      supabase.from("bookmarks").select("*").eq("user_id", user.id).eq("book_id", book.id).eq("chapter", chapterNum).eq("translation", translation).maybeSingle(),
      supabase.from("notes").select("*").eq("user_id", user.id).eq("book_id", book.id).eq("chapter", chapterNum).order("verse", { ascending: true }),
      supabase.from("highlights").select("*").eq("user_id", user.id).eq("book_id", book.id).eq("chapter", chapterNum).eq("translation", translation),
      supabase.from("bookmarks").select("book_id, chapter").eq("user_id", user.id),
      supabase.from("notes").select("book_id, chapter").eq("user_id", user.id),
    ]);
    bookmark = bm;
    initialNotes = (nt ?? []) as Note[];
    highlights = hl ?? [];
    bookmarkPositions = Object.fromEntries((allBookmarks ?? []).map(b => [b.book_id, b.chapter]));
    for (const n of allNotes ?? []) {
      (noteChapters[n.book_id] ??= []).push(n.chapter);
    }
  }

  return (
    <ReaderLayoutWrapper
      book={book}
      chapter={chapterNum}
      translation={translation}
      user={user}
      chapterData={chapterData}
      initialBookmark={bookmark}
      initialNotes={initialNotes}
      initialHighlights={highlights}
      openNote={noteParam === "1"}
      bookmarkPositions={bookmarkPositions}
      noteChapters={noteChapters}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { bookId, chapter } = await params;
  const book = BOOK_BY_ID[bookId?.toUpperCase()];
  if (!book) return {};
  return { title: `${book.name} ${chapter} — Psalm 119:9` };
}
