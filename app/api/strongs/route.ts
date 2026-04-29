import { NextRequest, NextResponse } from "next/server";
import { BIBLE_BOOKS } from "@/lib/books";
import { lookupStrongs } from "@/lib/strongs-lookup";

export interface WordStrongs {
  word: string;
  strongs: string;
  lemma: string;
  def: string;
  xlit?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bookId = searchParams.get("bookId");
  const chapter = parseInt(searchParams.get("chapter") ?? "0", 10);
  const verse = parseInt(searchParams.get("verse") ?? "0", 10);

  if (!bookId || !chapter || !verse) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) return NextResponse.json({ error: "Unknown book" }, { status: 404 });

  const book = BIBLE_BOOKS[bookIndex];
  const bookNum = bookIndex + 1;
  const prefix = book.testament === "OT" ? "H" : "G";

  const res = await fetch(
    `https://bolls.life/get-verse/KJV/${bookNum}/${chapter}/${verse}/`,
    { next: { revalidate: 31536000 } }
  );

  if (!res.ok) return NextResponse.json({ error: "Source unavailable" }, { status: 502 });

  const data = await res.json();
  const text: string = data.text ?? "";
  if (typeof text !== "string" || !text.includes("<S>")) {
    return NextResponse.json({ words: [] });
  }

  // Format: "word<S>number</S> word<S>number</S> ..."
  const words: WordStrongs[] = [];
  const re = /([^<]*)<S>(\d+)<\/S>/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const num = match[2];
    if (!num) continue;
    const strongsId = `${prefix}${num}`;
    const entry = lookupStrongs(strongsId);
    words.push({
      word: match[1].trim().replace(/[,;:.!?]+$/, "") || entry?.lemma || strongsId,
      strongs: strongsId,
      lemma: entry?.lemma ?? "",
      def: entry?.def ?? "",
      xlit: entry?.xlit,
    });
  }

  return NextResponse.json({ words }, {
    headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
