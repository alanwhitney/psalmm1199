import { NextRequest, NextResponse } from "next/server";
import { fetchChapter } from "@/lib/bible-api";
import { BOOK_BY_ID } from "@/lib/books";
import { Translation, TRANSLATIONS } from "@/types";

// One verse in every translation except `exclude` (the one being read).
// fetchChapter caches whole chapters for a day, so comparing several verses
// in the same chapter only costs upstream calls the first time.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bookId = searchParams.get("bookId")?.toUpperCase() ?? "";
  const chapter = parseInt(searchParams.get("chapter") ?? "", 10);
  const verse = parseInt(searchParams.get("verse") ?? "", 10);
  const exclude = searchParams.get("exclude");

  if (!BOOK_BY_ID[bookId] || !chapter || !verse) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  const translations = TRANSLATIONS.filter((t) => t !== exclude);
  const results = await Promise.all(
    translations.map(async (translation: Translation) => {
      try {
        const data = await fetchChapter(bookId, chapter, translation);
        const text = data.verses.find((v) => v.number === verse)?.text ?? null;
        return { translation, text };
      } catch {
        return { translation, text: null };
      }
    })
  );

  return NextResponse.json({ verses: results });
}
