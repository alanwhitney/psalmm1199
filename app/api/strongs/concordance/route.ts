import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_TIMEOUT_MS = 8000;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[HG]\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const num = id.slice(1);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://bolls.life/search/KJV/?search=${encodeURIComponent(`<S>${num}</S>`)}`,
      { signal: controller.signal, next: { revalidate: 31536000 } }
    );

    if (!res.ok) return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });

    const raw = await res.json();
    if (!Array.isArray(raw)) return NextResponse.json({ count: 0, verses: [], kjvWords: [] });

    const wordCounts: Record<string, number> = {};
    const markRe = /(\w[\w'-]*)\s*<mark><S>\d+<\/S><\/mark>/g;

    // bolls.life now returns substring matches alongside exact hits; filter to
    // only verses that have a <mark> tag (the exact match indicator).
    const exactMatches = (raw as { book: number; chapter: number; verse: number; text?: string }[])
      .filter(item => /<mark>/.test(item.text ?? ""));

    const verses = exactMatches.map((item) => {
      if (item.text) {
        let m;
        markRe.lastIndex = 0;
        while ((m = markRe.exec(item.text)) !== null) {
          const word = m[1].replace(/['']/g, "'").toLowerCase();
          wordCounts[word] = (wordCounts[word] ?? 0) + 1;
        }
      }
      return { b: item.book, c: item.chapter, v: item.verse };
    });

    const kjvWords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ count: verses.length, verses, kjvWords }, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Upstream timeout" : "Upstream error" },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
