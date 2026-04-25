import { BOOK_BY_ID } from "@/lib/books";

const DEFAULT = "/bible/PSA/119";
const VALID_TRANSLATIONS = ["KJV", "NKJV", "NIV", "ESV"];

/**
 * Parse last_position cookie value into a valid URL.
 * Falls back to default if cookie is missing or invalid.
 */
export function lastPositionUrl(cookieValue: string | undefined): string {
  if (!cookieValue) return DEFAULT;
  const [bookId, chapter, translation] = cookieValue.split(":");
  const book = BOOK_BY_ID[bookId];
  const chapterNum = parseInt(chapter, 10);
  if (
    book &&
    !isNaN(chapterNum) &&
    chapterNum >= 1 &&
    chapterNum <= book.chapters &&
    VALID_TRANSLATIONS.includes(translation)
  ) {
    return `/bible/${bookId}/${chapterNum}?t=${translation}`;
  }
  return DEFAULT;
}

/**
 * Read last_position from document.cookie (client-side only).
 */
export function getLastPositionUrl(): string {
  if (typeof document === "undefined") return DEFAULT;
  const match = document.cookie.match(/last_position=([^;]+)/);
  return lastPositionUrl(match ? decodeURIComponent(match[1]) : undefined);
}
