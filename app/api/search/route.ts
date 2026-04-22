import { NextRequest, NextResponse } from "next/server";
import { Translation } from "@/types";

const TRANSLATION_IDS: Record<string, string> = {
  KJV: process.env.BIBLE_API_KJV_ID || "de4e12af7f28f599-02",
  NKJV: process.env.BIBLE_API_NKJV_ID || "",
  NIV: process.env.BIBLE_API_NIV_ID || "3e2eb613d45e131e-01",
};

const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const translation = (searchParams.get("t") || "KJV") as Translation;

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const bibleId = TRANSLATION_IDS[translation];
  if (!bibleId) {
    return NextResponse.json({ error: "Translation not configured" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=20&sort=relevance`,
      { headers: { "api-key": process.env.BIBLE_API_KEY! } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: res.status });
    }

    const data = await res.json();
    const verses = data.data?.verses ?? [];

    const results = verses.map((v: {
      id: string;
      reference: string;
      text: string;
      bookId?: string;
      chapterId?: string;
    }) => {
      // Parse bookId and chapter from id like "PSA.119.1"
      const parts = v.id.split(".");
      const bookId = parts[0];
      const chapter = parseInt(parts[1], 10);
      const verseNum = parseInt(parts[2], 10);

      return {
        id: v.id,
        reference: v.reference,
        text: v.text?.trim() ?? "",
        bookId,
        chapter,
        verse: verseNum,
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
