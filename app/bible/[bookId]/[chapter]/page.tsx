import { notFound } from "next/navigation";
import { fetchChapter } from "@/lib/bible-api";
import { BOOK_BY_ID } from "@/lib/books";
import { Translation } from "@/types";
import ReaderLayout from "@/components/reader/ReaderLayout";
import ChapterView from "@/components/reader/ChapterView";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ bookId: string; chapter: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function BiblePage({ params, searchParams }: PageProps) {
  const { bookId, chapter: chapterStr } = await params;
  const { t } = await searchParams;

  const book = BOOK_BY_ID[bookId.toUpperCase()];
  if (!book) return notFound();

  const chapterNum = parseInt(chapterStr, 10);
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > book.chapters) {
    return notFound();
  }

  const VALID_TRANSLATIONS: Translation[] = ["KJV", "NKJV", "NIV"];
  const translation: Translation =
    VALID_TRANSLATIONS.includes(t as Translation) ? (t as Translation) : "KJV";

  // Fetch chapter text (server-side, cached)
  let chapterData;
  try {
    chapterData = await fetchChapter(bookId.toUpperCase(), chapterNum, translation);
  } catch (err) {
    // Fallback: show error state
    chapterData = null;
  }

  // Get session to know if user is logged in
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user, fetch their bookmark and note for this chapter
  let bookmark = null;
  let note = null;

  if (user) {
    const [{ data: bm }, { data: nt }] = await Promise.all([
      supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .eq("chapter", chapterNum)
        .eq("translation", translation)
        .maybeSingle(),
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .eq("chapter", chapterNum)
        .eq("translation", translation)
        .maybeSingle(),
    ]);
    bookmark = bm;
    note = nt;
  }

  return (
    <ReaderLayout
      book={book}
      chapter={chapterNum}
      translation={translation}
      user={user}
    >
      <ChapterView
        book={book}
        chapter={chapterNum}
        translation={translation}
        chapterData={chapterData}
        user={user}
        initialBookmark={bookmark}
        initialNote={note}
      />
    </ReaderLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { bookId, chapter } = await params;
  const book = BOOK_BY_ID[bookId?.toUpperCase()];
  if (!book) return {};
  return {
    title: `${book.name} ${chapter} — Psalm 119:9`,
  };
}
