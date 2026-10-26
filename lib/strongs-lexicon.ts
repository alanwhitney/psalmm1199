import { readFileSync } from "fs";
import { join } from "path";
import { lookupStrongs } from "./strongs-lookup";

// Built by scripts/build-strongs-lexicon.mjs
export type LexiconSeg = { t: string; b?: 1; i?: 1; r?: string };
export type LexiconLine = { d: number; s: LexiconSeg[] };

type RawEntry = { g?: string; p?: string; s?: LexiconLine[]; f?: string[]; k?: string[] };

export type RelatedWord = { id: string; lemma: string; xlit?: string; gloss?: string };

export type LexiconEntry = {
  gloss?: string;
  pos?: string;
  lines: LexiconLine[];
  source: "abbott-smith" | "bdb" | null;
  family: { from: RelatedWord[]; kids: RelatedWord[]; siblings: RelatedWord[] };
};

const cache: Partial<Record<"G" | "H", Record<string, RawEntry>>> = {};

function getDb(lang: "G" | "H"): Record<string, RawEntry> {
  if (!cache[lang]) {
    const file = lang === "G" ? "strongs-lexicon-greek.json" : "strongs-lexicon-hebrew.json";
    cache[lang] = JSON.parse(readFileSync(join(process.cwd(), "lib/data", file), "utf-8"));
  }
  return cache[lang]!;
}

const MAX_SIBLINGS = 24;

export function getLexiconEntry(id: string): LexiconEntry | null {
  const lang = id[0] as "G" | "H";
  if (lang !== "G" && lang !== "H") return null;
  const db = getDb(lang);
  const raw = db[id];
  if (!raw && !lookupStrongs(id)) return null;

  const related = (rid: string): RelatedWord | null => {
    const base = lookupStrongs(rid);
    if (!base) return null;
    return { id: rid, lemma: base.lemma, xlit: base.xlit, gloss: db[rid]?.g };
  };
  const toWords = (ids: string[]) => ids.map(related).filter((w): w is RelatedWord => w !== null);

  const from = raw?.f ?? [];
  const kids = raw?.k ?? [];
  const seen = new Set([id, ...from, ...kids]);
  const siblings: string[] = [];
  for (const p of from) {
    for (const s of db[p]?.k ?? []) {
      if (seen.has(s)) continue;
      seen.add(s);
      siblings.push(s);
    }
  }

  return {
    gloss: raw?.g,
    pos: raw?.p,
    lines: raw?.s ?? [],
    source: raw?.s ? (lang === "G" ? "abbott-smith" : "bdb") : null,
    family: {
      from: toWords(from),
      kids: toWords(kids),
      siblings: toWords(siblings.slice(0, MAX_SIBLINGS)),
    },
  };
}
