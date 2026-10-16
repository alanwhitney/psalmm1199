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

  // Targets are "BOOK.ch.v", "BOOK.ch.v-v2" (same-chapter range) or "BOOK.ch.v-ch2.v2"
  // (cross-chapter range) — see scripts/build-crossrefs.mjs
  const refs = raw.flatMap(ref => {
    const [start, end] = ref.split("-");
    const [rBook, rChapter, rVerse] = start.split(".");
    const book = BOOK_BY_ID[rBook];
    if (!book) return [];
    const rangeEnd = end ? `–${end.replace(".", ":")}` : "";
    return [{ bookId: rBook, chapter: parseInt(rChapter, 10), verse: parseInt(rVerse, 10), label: `${book.abbreviation} ${rChapter}:${rVerse}${rangeEnd}`, href: `/bible/${rBook}/${rChapter}` }];
  });

  return NextResponse.json({ refs });
}
