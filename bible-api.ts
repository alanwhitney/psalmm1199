import { Translation, Chapter, Verse } from "@/types";

// api.bible translation IDs
const TRANSLATION_IDS: Record<Translation, string> = {
  KJV: process.env.BIBLE_API_KJV_ID || "de4e12af7f28f599-02",
  NKJV: process.env.BIBLE_API_NKJV_ID || "", // Set in .env.local after registration
};

const API_BASE = "https://api.scripture.api.bible/v1";

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
 * The content field is an array of paragraph blocks with verse items.
 */
function parseVerses(content: unknown): Verse[] {
  const verses: Verse[] = [];

  if (!Array.isArray(content)) return verses;

  function walk(nodes: unknown[]) {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const n = node as Record<string, unknown>;

      if (n.type === "verse" && typeof n.number === "number") {
        const text = extractText(n.items as unknown[]);
        if (text) {
          verses.push({ number: n.number, text: text.trim() });
        }
      } else if (Array.isArray(n.items)) {
        walk(n.items as unknown[]);
      } else if (Array.isArray(n.content)) {
        walk(n.content as unknown[]);
      }
    }
  }

  walk(content);
  return verses;
}

function extractText(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return "";
  return nodes
    .map((n) => {
      if (typeof n === "string") return n;
      if (typeof n === "object" && n !== null) {
        const node = n as Record<string, unknown>;
        if (node.text) return node.text;
        if (Array.isArray(node.items)) return extractText(node.items as unknown[]);
        if (Array.isArray(node.content)) return extractText(node.content as unknown[]);
      }
      return "";
    })
    .join("");
}
