// Downloads KJV verse text (with Strong's tags) from bolls.life and produces
// lib/data/strongs-concordance.json — a lookup:
//   { "H430": { "v": [[b,c,v], ...], "w": { "God": 500, ... } }, ... }
// b = 1-indexed book number, c = chapter, v = verse
// Run once: node scripts/build-strongs-concordance.mjs

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const BOOKS = [
  ["GEN", 50], ["EXO", 40], ["LEV", 27], ["NUM", 36], ["DEU", 34],
  ["JOS", 24], ["JDG", 21], ["RUT", 4],  ["1SA", 31], ["2SA", 24],
  ["1KI", 22], ["2KI", 25], ["1CH", 29], ["2CH", 36], ["EZR", 10],
  ["NEH", 13], ["EST", 10], ["JOB", 42], ["PSA", 150], ["PRO", 31],
  ["ECC", 12], ["SNG", 8],  ["ISA", 66], ["JER", 52], ["LAM", 5],
  ["EZK", 48], ["DAN", 12], ["HOS", 14], ["JOL", 3],  ["AMO", 9],
  ["OBA", 1],  ["JON", 4],  ["MIC", 7],  ["NAM", 3],  ["HAB", 3],
  ["ZEP", 3],  ["HAG", 2],  ["ZEC", 14], ["MAL", 4],
  // NT — Strong's G numbers
  ["MAT", 28], ["MRK", 16], ["LUK", 24], ["JHN", 21], ["ACT", 28],
  ["ROM", 16], ["1CO", 16], ["2CO", 13], ["GAL", 6],  ["EPH", 6],
  ["PHP", 4],  ["COL", 4],  ["1TH", 5],  ["2TH", 3],  ["1TI", 6],
  ["2TI", 4],  ["TIT", 3],  ["PHM", 1],  ["HEB", 13], ["JAS", 5],
  ["1PE", 5],  ["2PE", 3],  ["1JN", 5],  ["2JN", 1],  ["3JN", 1],
  ["JUD", 1],  ["REV", 22],
];

const CONCURRENCY = 12;
const RETRY_DELAY_MS = 2000;

// word immediately before <S>NUM</S>, allowing punctuation between
const WORD_TAG_RE = /([\w][\w'-]*)[^a-zA-Z<]*<S>(\d+)<\/S>/g;

const conc = {};

async function fetchChapter(bookNum, chapter, prefix, retries = 3) {
  const url = `https://bolls.life/get-text/KJV/${bookNum}/${chapter}/`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      else throw err;
    }
  }
}

function processVerses(verses, bookNum, chapter, prefix) {
  for (const v of verses) {
    const text = v.text ?? "";
    WORD_TAG_RE.lastIndex = 0;
    let m;
    while ((m = WORD_TAG_RE.exec(text)) !== null) {
      const word = m[1];
      const key = prefix + m[2];
      if (!conc[key]) conc[key] = { v: [], w: {} };
      conc[key].v.push([bookNum, chapter, v.verse]);
      conc[key].w[word] = (conc[key].w[word] ?? 0) + 1;
    }
  }
}

// Build work queue
const queue = [];
for (let i = 0; i < BOOKS.length; i++) {
  const bookNum = i + 1;
  const [, chapters] = BOOKS[i];
  const prefix = bookNum <= 39 ? "H" : "G";
  for (let ch = 1; ch <= chapters; ch++) {
    queue.push({ bookNum, chapter: ch, prefix });
  }
}

const total = queue.length;
let done = 0;
let errors = 0;

async function worker(items) {
  for (const { bookNum, chapter, prefix } of items) {
    try {
      const verses = await fetchChapter(bookNum, chapter, prefix);
      processVerses(verses, bookNum, chapter, prefix);
    } catch (err) {
      errors++;
      process.stderr.write(`\n  ERROR book=${bookNum} ch=${chapter}: ${err.message}`);
    }
    done++;
    if (done % 50 === 0 || done === total) {
      process.stdout.write(`\r  ${done}/${total} chapters (${errors} errors)   `);
    }
  }
}

// Split queue across CONCURRENCY workers
console.log(`Fetching ${total} chapters with concurrency=${CONCURRENCY}...`);
const chunkSize = Math.ceil(total / CONCURRENCY);
const workers = [];
for (let i = 0; i < CONCURRENCY; i++) {
  workers.push(worker(queue.slice(i * chunkSize, (i + 1) * chunkSize)));
}
await Promise.all(workers);
console.log();

const uniqueIds = Object.keys(conc).length;
const totalRefs = Object.values(conc).reduce((s, e) => s + e.v.length, 0);
console.log(`${uniqueIds} unique Strong's IDs, ${totalRefs} total verse-refs`);

mkdirSync(join(ROOT, "lib/data"), { recursive: true });
const outPath = join(ROOT, "lib/data/strongs-concordance.json");
const json = JSON.stringify(conc, null, 0);
writeFileSync(outPath, json);
console.log(`Written to lib/data/strongs-concordance.json (${Math.round(json.length / 1024)}KB)`);
