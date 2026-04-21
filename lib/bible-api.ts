import { Translation, Chapter, Verse } from "@/types";

// api.bible translation IDs
const TRANSLATION_IDS: Record<Translation, string> = {
  KJV: process.env.BIBLE_API_KJV_ID || "de4e12af7f28f599-02",
  NKJV: process.env.BIBLE_API_NKJV_ID || "",
  NIV: process.env.BIBLE_API_NIV_ID || "3e2eb613d45e131e-01",
};

const API_BASE = "https://rest.api.bible/v1";

async function apiBibleFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "api-key": process.env.BIBLE_API_KEY!,
    },
    next: { revalidate: 60 * 60 * 24 }, // Cache chapters for 24h
  });

  if (!res.ok) {
    throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch a chapter from api.bible.
 * Returns parsed verses array.
 */
export async function fetchChapter(
  bookId: string,
  chapter: number,
  translation: Translation
): Promise<Chapter> {
  const bibleId = TRANSLATION_IDS[translation];
  if (!bibleId) {
    throw new Error(`Translation ${translation} not configured. Add its ID to .env.local.`);
  }

  const chapterId = `${bookId}.${chapter}`;

  const data = await apiBibleFetch(
    `/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`
  );

  // api.bible returns content as HTML or JSON blocks — parse verses
  const verses = parseVerses(data.data.content);

  return {
    book: data.data.bookId,
    bookId,
    chapter,
    translation,
    verses,
  };
}

/**
 * Parse the api.bible JSON content into clean verse objects.
 *
 * The API returns an array of `para` tag nodes. Inside each para there are
 * `verse` tag nodes (name="verse", type="tag") that mark the start of a verse.
 * Text nodes that follow (until the next verse tag) belong to that verse.
 *
 * Structure example:
 * { name:"para", type:"tag", items: [
 *     { name:"verse", type:"tag", attrs:{ number:"1", sid:"PSA 119:1" }, items:[...] },
 *     { text:"Blessed are...", type:"text", attrs:{ verseId:"PSA.119.1" } },
 *     { name:"verse", type:"tag", attrs:{ number:"2", ... }, items:[...] },
 *     { text:"Blessed are they...", type:"text", attrs:{ verseId:"PSA.119.2" } },
 * ]}
 */
function parseVerses(content: unknown): Verse[] {
  if (!Array.isArray(content)) return [];

  // Collect all nodes in document order by flattening para items
  const flat: Record<string, unknown>[] = [];

  for (const para of content) {
    if (typeof para !== "object" || para === null) continue;
    const p = para as Record<string, unknown>;
    if (!Array.isArray(p.items)) continue;
    for (const item of p.items as Record<string, unknown>[]) {
      flat.push(item);
    }
  }

  // Walk flat list: when we see a verse tag, start accumulating text for it
  const verseMap = new Map<number, string>();
  let currentVerse: number | null = null;

  for (const node of flat) {
    if (node.name === "verse" && node.type === "tag") {
      // New verse marker — extract verse number from attrs
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const numStr = attrs?.number ?? attrs?.sid;
      if (typeof numStr === "string") {
        const num = parseInt(numStr.split(":").pop() ?? numStr, 10);
        if (!isNaN(num)) {
          currentVerse = num;
          if (!verseMap.has(num)) verseMap.set(num, "");
        }
      }
      continue;
    }

    if (currentVerse === null) continue;

    // Gather text from this node
    const text = collectText(node);
    if (text) {
      verseMap.set(currentVerse, (verseMap.get(currentVerse) ?? "") + text);
    }
  }

  // Convert map to sorted array, cleaning up whitespace
  return Array.from(verseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, text]) => ({ number, text: text.trim().replace(/\s+/g, " ") }))
    .filter((v) => v.text.length > 0);
}

/** Recursively collect all text strings from a node tree */
function collectText(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node !== "object" || node === null) return "";
  const n = node as Record<string, unknown>;

  // Plain text node
  if (n.type === "text" && typeof n.text === "string") {
    return n.text;
  }

  // Tag node with children
  if (Array.isArray(n.items)) {
    return (n.items as unknown[]).map(collectText).join("");
  }

  return "";
}
