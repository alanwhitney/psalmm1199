// Reads ancient.jsonl from the openbibleinfo/Bible-Geocoding-Data repo and
// produces lib/data/chapter-places.json — a compact lookup:
//   { "MAT.8": [{ "name": "Capernaum", "lat": 32.88, "lon": 35.58 }, ...] }
//
// Run: node scripts/build-chapter-places.mjs [/path/to/Bible-Geocoding-Data]
// Default source path: ../../Bible-Geocoding-Data (sibling of this repo)

import { createReadStream, writeFileSync, mkdirSync } from "fs";
import { createInterface } from "readline";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = process.argv[2] ?? join(ROOT, "..", "Bible-Geocoding-Data");
const INPUT = join(SOURCE, "data", "ancient.jsonl");
const OUTPUT = join(ROOT, "lib", "data", "chapter-places.json");

// OSIS book codes → app USX book IDs
const OSIS_TO_USX = {
  Gen: "GEN", Exod: "EXO", Lev: "LEV", Num: "NUM", Deut: "DEU",
  Josh: "JOS", Judg: "JDG", Ruth: "RUT",
  "1Sam": "1SA", "2Sam": "2SA",
  "1Kgs": "1KI", "2Kgs": "2KI",
  "1Chr": "1CH", "2Chr": "2CH",
  Ezra: "EZR", Neh: "NEH", Esth: "EST",
  Job: "JOB", Ps: "PSA", Prov: "PRO", Eccl: "ECC", Song: "SNG",
  Isa: "ISA", Jer: "JER", Lam: "LAM", Ezek: "EZK", Dan: "DAN",
  Hos: "HOS", Joel: "JOL", Amos: "AMO", Obad: "OBA", Jonah: "JON",
  Mic: "MIC", Nah: "NAM", Hab: "HAB", Zeph: "ZEP", Hag: "HAG",
  Zech: "ZEC", Mal: "MAL",
  Matt: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
  Rom: "ROM", "1Cor": "1CO", "2Cor": "2CO", Gal: "GAL", Eph: "EPH",
  Phil: "PHP", Col: "COL", "1Thess": "1TH", "2Thess": "2TH",
  "1Tim": "1TI", "2Tim": "2TI", Titus: "TIT", Phlm: "PHM",
  Heb: "HEB", Jas: "JAS",
  "1Pet": "1PE", "2Pet": "2PE",
  "1John": "1JN", "2John": "2JN", "3John": "3JN",
  Jude: "JUD", Rev: "REV",
};

// Strip trailing disambiguation numbers e.g. "Bethlehem 1" → "Bethlehem"
function cleanName(name) {
  return name.replace(/\s+\d+$/, "").trim();
}

// Pick the highest-scored identification that has a lonlat
function bestLonLat(identifications) {
  let best = null;
  let bestScore = -Infinity;
  for (const ident of identifications) {
    const total = ident.score?.time_total ?? 0;
    for (const res of ident.resolutions ?? []) {
      if (res.lonlat && total > bestScore) {
        best = res.lonlat;
        bestScore = total;
      }
    }
  }
  return best;
}

const chapterPlaces = {};
const seen = new Set();
let total = 0;
let skipped = 0;

const rl = createInterface({ input: createReadStream(INPUT), crlfDelay: Infinity });

for await (const line of rl) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);

  const lonlat = bestLonLat(obj.identifications ?? []);
  if (!lonlat) { skipped++; continue; }

  const [lon, lat] = lonlat.split(",").map(Number);
  const name = cleanName(obj.friendly_id ?? "");

  for (const v of obj.verses ?? []) {
    const osis = v.osis ?? "";
    const parts = osis.split(".");
    if (parts.length < 2) continue;

    const usx = OSIS_TO_USX[parts[0]];
    if (!usx) continue;

    const chapterKey = `${usx}.${parts[1]}`;
    const dedupeKey = `${chapterKey}|${name}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (!chapterPlaces[chapterKey]) chapterPlaces[chapterKey] = [];
    chapterPlaces[chapterKey].push({ name, lat: +lat.toFixed(4), lon: +lon.toFixed(4) });
    total++;
  }
}

mkdirSync(join(ROOT, "lib", "data"), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(chapterPlaces));

const chapterCount = Object.keys(chapterPlaces).length;
const fileSizeKb = (JSON.stringify(chapterPlaces).length / 1024).toFixed(1);
console.log(`✓ ${total} place-chapter entries across ${chapterCount} chapters`);
console.log(`✓ ${skipped} places skipped (no coordinates)`);
console.log(`✓ Written to ${OUTPUT} (${fileSizeKb} KB)`);
