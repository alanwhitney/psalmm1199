import greekDict from "./strongs-greek.json";
import hebrewDict from "./strongs-hebrew.json";

export interface StrongsEntry {
  lemma: string;
  def?: string;
  xlit?: string;
  derivation?: string;
}

export function lookupStrongs(id: string): StrongsEntry | null {
  if (id.startsWith("G")) return (greekDict as Record<string, StrongsEntry>)[id] ?? null;
  if (id.startsWith("H")) return (hebrewDict as Record<string, StrongsEntry>)[id] ?? null;
  return null;
}
