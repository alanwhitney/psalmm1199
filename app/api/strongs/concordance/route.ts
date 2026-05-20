import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[HG]\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const num = id.slice(1); // strip H or G prefix
  const res = await fetch(
    `https://bolls.life/search/KJV/?search=${encodeURIComponent(`<S>${num}</S>`)}`,
    { next: { revalidate: 31536000 } }
  );

  if (!res.ok) return NextResponse.json({ error: "Unavailable" }, { status: 502 });

  const raw = await res.json();
  const verses = Array.isArray(raw)
    ? raw.map((item: { book: number; chapter: number; verse: number }) => ({
        b: item.book,
        c: item.chapter,
        v: item.verse,
      }))
    : [];

  return NextResponse.json({ count: verses.length, verses }, {
    headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
