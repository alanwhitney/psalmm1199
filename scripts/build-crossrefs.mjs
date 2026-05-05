// Downloads the scrollmapper cross-reference SQL dumps and produces
// lib/data/crossrefs.json — a compact lookup: { "GEN.1.1": ["PRO.8.22", ...] }
// Run once: node scripts/build-crossrefs.mjs

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Full book name → our app book ID (uppercase 3-letter)
const BOOK_MAP = {
  "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM",
  "Deuteronomy": "DEU", "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT",
  "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
  "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH",
  "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
  "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA",
  "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN",
  "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA",
  "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB",
  "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
  "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
  "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
  "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
  "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI",
  "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB",
  "James": "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN",
  "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV",
};

const BASE = "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/sql/extras";
const FILES = 7;
const MIN_VOTES = 3;
const MAX_PER_VERSE = 10;

// { "GEN.1.1": [ [targetKey, votes], ... ] }
const raw = {};

const INSERT_RE = /VALUES \('([^']+)', (\d+), (\d+), '([^']+)', (\d+), (\d+), (\d+), (\d+)\)/g;

for (let i = 0; i < FILES; i++) {
  const url = `${BASE}/cross_references_${i}.sql`;
  process.stdout.write(`Fetching ${url} ...`);
  const res = await fetch(url);
  const text = await res.text();
  let m;
  INSERT_RE.lastIndex = 0;
  let count = 0;
  while ((m = INSERT_RE.exec(text)) !== null) {
    const [, fromBook, fromChapter, fromVerse, toBook, toChapter, toVerseStart, , votes] = m;
    const v = parseInt(votes, 10);
    if (v < MIN_VOTES) continue;
    const fromId = BOOK_MAP[fromBook];
    const toId = BOOK_MAP[toBook];
    if (!fromId || !toId) continue;
    const fromKey = `${fromId}.${fromChapter}.${fromVerse}`;
    const toKey = `${toId}.${toChapter}.${toVerseStart}`;
    if (fromKey === toKey) continue; // skip self-refs
    if (!raw[fromKey]) raw[fromKey] = [];
    raw[fromKey].push([toKey, v]);
    count++;
  }
  console.log(` ${count} kept`);
}

// Sort each entry by votes desc, keep top MAX_PER_VERSE, drop vote counts
const out = {};
for (const [key, refs] of Object.entries(raw)) {
  refs.sort((a, b) => b[1] - a[1]);
  out[key] = refs.slice(0, MAX_PER_VERSE).map(r => r[0]);
}

const totalVerses = Object.keys(out).length;
const totalRefs = Object.values(out).reduce((s, a) => s + a.length, 0);
console.log(`\n${totalVerses} verses with cross-refs, ${totalRefs} total links`);

mkdirSync(join(ROOT, "lib/data"), { recursive: true });
const outPath = join(ROOT, "lib/data/crossrefs.json");
writeFileSync(outPath, JSON.stringify(out));
const kb = Math.round(writeFileSync.length / 1024) || Math.round(JSON.stringify(out).length / 1024);
console.log(`Written to lib/data/crossrefs.json (~${kb}KB)`);
