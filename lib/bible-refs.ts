import { BIBLE_BOOKS } from "@/lib/books";
import { Translation } from "@/types";

// Map normalized name/abbreviation → book ID
const NAME_TO_ID: Record<string, string> = {};
for (const book of BIBLE_BOOKS) {
  NAME_TO_ID[book.name.toLowerCase()] = book.id;
  NAME_TO_ID[book.abbreviation.toLowerCase()] = book.id;
}

// Common aliases not covered by name/abbreviation
const ALIASES: Record<string, string> = {
  "psalm": "PSA", "ps": "PSA",
  "song of songs": "SNG", "song": "SNG",
  "phil": "PHP",
  "1 john": "1JN", "2 john": "2JN", "3 john": "3JN",
  "1john": "1JN", "2john": "2JN", "3john": "3JN",
  "1 cor": "1CO", "2 cor": "2CO",
  "1 thess": "1TH", "2 thess": "2TH",
  "1 tim": "1TI", "2 tim": "2TI",
  "1 pet": "1PE", "2 pet": "2PE",
  "1 sam": "1SA", "2 sam": "2SA",
  "1 kin": "1KI", "2 kin": "2KI",
  "1 chron": "1CH", "2 chron": "2CH",
  "rev": "REV", "zech": "ZEC", "mal": "MAL",
};
for (const [alias, id] of Object.entries(ALIASES)) {
  NAME_TO_ID[alias] = id;
}

// Build alternation pattern sorted longest-first to avoid partial matches
const NAMES_PATTERN = Object.keys(NAME_TO_ID)
  .sort((a, b) => b.length - a.length)
  .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const REF_REGEX = new RegExp(
  `\\b(${NAMES_PATTERN})\\s+(\\d+)(?::(\\d+))?\\b`,
  "gi"
);

export interface BibleRef {
  bookId: string;
  chapter: number;
  verse?: number;
  label: string;
  href: string;
}

export function detectBibleRefs(text: string, translation: Translation): BibleRef[] {
  const seen = new Set<string>();
  const refs: BibleRef[] = [];

  for (const match of text.matchAll(REF_REGEX)) {
    const rawName = match[1].toLowerCase();
    const bookId = NAME_TO_ID[rawName];
    if (!bookId) continue;
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : undefined;
    const key = `${bookId}:${chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book || chapter < 1 || chapter > book.chapters) continue;

    refs.push({
      bookId,
      chapter,
      verse,
      label: verse ? `${book.name} ${chapter}:${verse}` : `${book.name} ${chapter}`,
      href: `/bible/${bookId}/${chapter}?t=${translation}${verse ? `#v${verse}` : ""}`,
    });
  }
  return refs;
}
