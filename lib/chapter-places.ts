export type MapPlace = { name: string; lat: number; lon: number };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("./data/chapter-places.json") as Record<string, MapPlace[]>;

export function getChapterPlaces(bookId: string, chapter: number): MapPlace[] {
  return data[`${bookId}.${chapter}`] ?? [];
}
