import { Translation, Chapter, Verse } from "@/types";

const TRANSLATION_IDS: Record<Translation, string> = {
  KJV: process.env.BIBLE_API_KJV_ID || "de4e12af7f28f599-02",
  NKJV: process.env.BIBLE_API_NKJV_ID || "",
  NIV: process.env.BIBLE_API_NIV_ID || "3e2eb613d45e131e-01",
};

const API_BASE = "https://rest.api.bible/v1";

async function apiBibleFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "api-key": process.env.BIBLE_API_KEY! },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchChapter(bookId: string, chapter: number, translation: Translation): Promise<Chapter> {
  const bibleId = TRANSLATION_IDS[translation];
  if (!bibleId) throw new Error(`Translation ${translation} not configured.`);

  const data = await apiBibleFetch(
    `/bibles/${bibleId}/chapters/${bookId}.${chapter}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`
  );

  return {
    book: data.data.bookId,
    bookId,
    chapter,
    translation,
    verses: parseVerses(data.data.content),
  };
}

// Paragraph styles that are poetic lines (q1, q2, q3, qc, qr, qm etc.)
const POETIC_STYLES = new Set(["q1", "q2", "q3", "qc", "qr", "qm", "qm1", "qm2"]);

// Paragraph styles that are section headers to skip entirely
const SKIP_STYLES = new Set(["qa", "d", "ms", "ms1", "ms2", "mr", "sr", "r", "sp"]);

function parseVerses(content: unknown): Verse[] {
  if (!Array.isArray(content)) return [];

  // Each entry: { paraStyle, node }
  // We process para by para, tracking style so we know when to add line breaks
  const segments: { paraStyle: string; node: Record<string, unknown> }[] = [];

  for (const para of content) {
    if (typeof para !== "object" || para === null) continue;
    const p = para as Record<string, unknown>;
    const attrs = p.attrs as Record<string, unknown> | undefined;
    const style = (attrs?.style as string) ?? "";

    // Skip acrostic headers and section titles entirely
    if (SKIP_STYLES.has(style)) continue;

    if (!Array.isArray(p.items)) continue;
    for (const item of p.items as Record<string, unknown>[]) {
      segments.push({ paraStyle: style, node: item as Record<string, unknown> });
    }
  }

  // Walk segments, accumulating verse text
  // Use \n as line break marker within a verse for poetic lines
  const verseMap = new Map<number, string[]>(); // number -> array of line segments
  let currentVerse: number | null = null;
  let lastParaStyle = "";

  for (const { paraStyle, node } of segments) {
    if (node.name === "verse" && node.type === "tag") {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const numStr = (attrs?.number ?? attrs?.sid) as string | undefined;
      if (numStr) {
        const num = parseInt(numStr.split(":").pop() ?? numStr, 10);
        if (!isNaN(num)) {
          currentVerse = num;
          if (!verseMap.has(num)) verseMap.set(num, []);
        }
      }
      lastParaStyle = paraStyle;
      continue;
    }

    if (currentVerse === null) continue;

    const text = collectText(node).trim();
    if (!text) continue;

    const lines = verseMap.get(currentVerse)!;

    // If this segment is in a new poetic para line, add a line break
    const isPoetic = POETIC_STYLES.has(paraStyle);
    const needsBreak = isPoetic && lines.length > 0 && paraStyle !== lastParaStyle;

    if (needsBreak) {
      lines.push("\n");
    } else if (lines.length > 0) {
      // Same paragraph — add a space if needed
      const last = lines[lines.length - 1];
      if (last !== "\n" && !last.endsWith(" ")) {
        lines.push(" ");
      }
    }

    lines.push(text);
    lastParaStyle = paraStyle;
  }

  return Array.from(verseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, lines]) => ({
      number,
      text: lines.join("").trim(),
    }))
    .filter((v) => v.text.length > 0);
}

function collectText(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node !== "object" || node === null) return "";
  const n = node as Record<string, unknown>;
  if (n.type === "text" && typeof n.text === "string") return n.text;
  if (Array.isArray(n.items)) return (n.items as unknown[]).map(collectText).join("");
  return "";
}
