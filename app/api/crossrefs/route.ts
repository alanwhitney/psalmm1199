import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { BOOK_BY_ID } from "@/lib/books";

let cache: Record<string, string[]> | null = null;

function getData(): Record<string, string[]> {
  if (!cache) {
    cache = JSON.parse(readFileSync(join(process.cwd(), "lib/data/crossrefs.json"), "utf-8"));
  }
  return cache!;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bookId = searchParams.get("bookId")?.toUpperCase();
  const chapter = searchParams.get("chapter");
  const verse = searchParams.get("verse");

  if (!bookId || !chapter || !verse) return NextResponse.json({ refs: [] });

  const key = `${bookId}.${chapter}.${verse}`;
  const raw = getData()[key] ?? [];

  const refs = raw.flatMap(ref => {
    const [rBook, rChapter, rVerse] = ref.split(".");
    const book = BOOK_BY_ID[rBook];
    if (!book) return [];
    return [{ bookId: rBook, chapter: parseInt(rChapter, 10), verse: parseInt(rVerse, 10), label: `${book.abbreviation} ${rChapter}:${rVerse}`, href: `/bible/${rBook}/${rChapter}` }];
  });

  return NextResponse.json({ refs });
}
