import { NextRequest, NextResponse } from "next/server";
import { Translation } from "@/types";
import { BIBLE_BOOKS } from "@/lib/books";

const BOOK_ORDER = Object.fromEntries(BIBLE_BOOKS.map((b, i) => [b.id, i]));

const TRANSLATION_IDS: Record<string, string> = {
  KJV: process.env.BIBLE_API_KJV_ID || "de4e12af7f28f599-02",
  NKJV: process.env.BIBLE_API_NKJV_ID || "",
  NIV: process.env.BIBLE_API_NIV_ID || "3e2eb613d45e131e-01",
};

const API_BASE = "https://rest.api.bible/v1";

const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const translation = (searchParams.get("t") || "KJV") as Translation;
  const limit = Math.min(MAX_PAGE_SIZE, parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10) || PAGE_SIZE);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const bibleId = TRANSLATION_IDS[translation];
  if (!bibleId) {
    return NextResponse.json({ error: "Translation not configured" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort=relevance`,
      { headers: { "api-key": process.env.BIBLE_API_KEY! } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: res.status });
    }

    const data = await res.json();
    const verses = data.data?.verses ?? [];
    const total = data.data?.total ?? verses.length;

    const results = verses.map((v: {
      id: string;
      reference: string;
      text: string;
    }) => {
      const parts = v.id.split(".");
      return {
        id: v.id,
        reference: v.reference,
        text: v.text?.trim() ?? "",
        bookId: parts[0],
        chapter: parseInt(parts[1], 10),
        verse: parseInt(parts[2], 10),
      };
    });

    results.sort((a: { bookId: string; chapter: number; verse: number }, b: { bookId: string; chapter: number; verse: number }) => {
      const bookDiff = (BOOK_ORDER[a.bookId] ?? 999) - (BOOK_ORDER[b.bookId] ?? 999);
      if (bookDiff !== 0) return bookDiff;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    return NextResponse.json({ results, total, offset, limit });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
