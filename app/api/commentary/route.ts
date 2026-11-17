import { NextRequest, NextResponse } from "next/server";
import { BOOK_BY_ID } from "@/lib/books";
import { CommentaryPara, CommentarySection, CommentarySeg } from "@/lib/commentary";

// Tyndale Open Study Notes and Matthew Henry, fetched from the Free Use Bible
// API (bible.helloao.org) and normalised to CommentaryChapter. Upstream
// chapters never change, so Next's data cache holds them for 30 days.
// ?intro=1 returns the book introduction instead of the chapter.

const UPSTREAM = "https://bible.helloao.org/api/c";
const SOURCES = new Set(["tyndale", "matthew-henry"]);

type UpstreamChapter = {
  book: { introduction?: string };
  chapter: {
    introduction?: string;
    content: { type: string; number: number; content: string[] }[];
  };
};

// Short line without closing punctuation, e.g. "Summary" or "Authorship"
const looksLikeHeading = (line: string) => line.length < 60 && !/[.:;?!,"”)]$/.test(line);

function paras(text: string, headings: boolean): CommentaryPara[] {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (headings && looksLikeHeading(l) ? { s: [{ t: l }], h: 1 as const } : { s: [{ t: l }] }));
}

// Tyndale notes open with the phrase they explain: "born again: Or born from above."
function tyndaleSegs(text: string): CommentarySeg[] {
  const m = text.match(/^([^:.;!?]{1,60}?): (?=\S)/);
  if (m && m[1].split(" ").length <= 7) return [{ t: m[1], b: 1 }, { t: text.slice(m[1].length) }];
  return [{ t: text }];
}

function tyndale(data: UpstreamChapter, chapter: number): CommentarySection[] {
  const sections: CommentarySection[] = [];
  for (const item of data.chapter.content) {
    if (item.type !== "verse") continue;
    for (const note of item.content) {
      // "3:16 ", "1:3-5 ", "3:36–4:2 "
      const m = note.match(/^(\d+):(\d+)(?:[-–](\d+)(?::(\d+))?)?\s+/);
      // Psalms overview notes: "Ps 1 …", "Pss 1–8 …"
      const ps = note.match(/^(Pss?) (\d+(?:[-–]\d+)?)\s+/);
      if (ps) {
        const h = `${ps[1] === "Pss" ? "Psalms" : "Psalm"} ${ps[2].replace("-", "–")}`;
        sections.push({ h, p: note.slice(ps[0].length).split(/\s*•\s*/).filter(Boolean).map((t) => ({ s: tyndaleSegs(t) })) });
        continue;
      }
      let v: [number, number] = [item.number, item.number];
      let body = note;
      if (m) {
        body = note.slice(m[0].length);
        if (Number(m[1]) === chapter) {
          const start = Number(m[2]);
          const end = m[4] ? 999 : m[3] ? Number(m[3]) : start;
          v = [start, end];
        }
      }
      const p = body.split(/\s*•\s*/).filter(Boolean).map((t) => ({ s: tyndaleSegs(t) }));
      sections.push({ v, p });
    }
  }
  return sections;
}

function matthewHenry(data: UpstreamChapter): CommentarySection[] {
  const sections: CommentarySection[] = [];
  if (data.chapter.introduction) sections.push({ h: "Introduction", p: paras(data.chapter.introduction, false) });
  const items = data.chapter.content.filter((i) => i.type === "verse").sort((a, b) => a.number - b.number);
  items.forEach((item, i) => {
    // The last section runs to the end of the chapter (upstream has no verse count)
    const end = items[i + 1] ? Math.max(item.number, items[i + 1].number - 1) : 999;
    sections.push({ v: [item.number, end], p: paras(item.content.join("\n"), false) });
  });
  return sections;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const source = searchParams.get("source") ?? "";
  const bookId = searchParams.get("book")?.toUpperCase() ?? "";
  const chapter = parseInt(searchParams.get("chapter") ?? "", 10);
  const intro = searchParams.get("intro") === "1";

  if (!SOURCES.has(source) || !BOOK_BY_ID[bookId] || !chapter) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${UPSTREAM}/${source}/${bookId}/${chapter}.json`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
  }
  if (res.status === 404) return NextResponse.json({ error: "Not available" }, { status: 404 });
  if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const data: UpstreamChapter = await res.json();

  const headers = { "Cache-Control": "public, max-age=86400, s-maxage=2592000" };
  if (intro) {
    return NextResponse.json({ intro: paras(data.book.introduction ?? "", true) }, { headers });
  }
  const sections = source === "tyndale" ? tyndale(data, chapter) : matthewHenry(data);
  return NextResponse.json({ sections }, { headers });
}
