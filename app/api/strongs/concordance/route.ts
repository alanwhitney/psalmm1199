import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

type ConcordanceEntry = {
  v: [number, number, number][];
  w: Record<string, number>;
};

let cache: Record<string, ConcordanceEntry> | null = null;

function getDb(): Record<string, ConcordanceEntry> {
  if (!cache) {
    cache = JSON.parse(
      readFileSync(join(process.cwd(), "lib/data/strongs-concordance.json"), "utf-8")
    );
  }
  return cache!;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[HG]\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  const entry = db[id];

  if (!entry) {
    return NextResponse.json({ count: 0, verses: [], kjvWords: [] }, {
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  const verses = entry.v.map(([b, c, v]) => ({ b, c, v }));
  const kjvWords = Object.entries(entry.w)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ count: verses.length, verses, kjvWords }, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
