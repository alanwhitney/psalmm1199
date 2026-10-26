// Builds detailed lexicon entries for the Strong's modal:
//   lib/data/strongs-lexicon-greek.json   — Abbott-Smith via STEPBible TBESG
//   lib/data/strongs-lexicon-hebrew.json  — Brown-Driver-Briggs via Open Scriptures,
//                                            with glosses / part of speech from STEPBible TBESH
// Each file: { "G26": { g: gloss, p: "Noun · feminine", s: Line[], f: [parentIds], k: [childIds] } }
//   Line = { d: depth, s: Seg[] }   Seg = { t: text, b?: 1, i?: 1, r?: "BOOKID.c.v" }
// f/k ("from" / "kids") come from the derivation text in lib/strongs-{greek,hebrew}.json.
//
// Sources (both CC BY 4.0 — credit is shown in the modal):
//   STEPBible-Data  https://github.com/STEPBible/STEPBible-Data  (credit "STEP Bible", STEPBible.org)
//   OSHB HebrewLexicon  https://github.com/openscriptures/HebrewLexicon  (BDB text is public domain)
// TBESH's "Meaning" column (Online Bible abridged BDB) is NOT used: its notes require
// separate permission from Online Bible.
//
// Run once: node scripts/build-strongs-lexicon.mjs

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const STEP = "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/";
const TBESG_URL = STEP + encodeURIComponent("TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt");
const TBESH_URL = STEP + encodeURIComponent("TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt");
const OSHB = "https://raw.githubusercontent.com/openscriptures/HebrewLexicon/master/";

// Book codes used by the sources → our book ids (lib/books.ts)
const BOOK_ALIASES = {
  // STEP / Abbott-Smith
  GEN: "GEN", EXO: "EXO", LEV: "LEV", NUM: "NUM", DEU: "DEU", JOS: "JOS", JDG: "JDG", RUT: "RUT",
  "1SA": "1SA", "2SA": "2SA", "1KI": "1KI", "2KI": "2KI", "1CH": "1CH", "2CH": "2CH", EZR: "EZR",
  NEH: "NEH", EST: "EST", JOB: "JOB", PSA: "PSA", PRO: "PRO", ECC: "ECC", SNG: "SNG", ISA: "ISA",
  JER: "JER", LAM: "LAM", EZK: "EZK", DAN: "DAN", HOS: "HOS", JOL: "JOL", AMO: "AMO", OBA: "OBA",
  JON: "JON", MIC: "MIC", NAM: "NAM", HAB: "HAB", ZEP: "ZEP", HAG: "HAG", ZEC: "ZEC", MAL: "MAL",
  MAT: "MAT", MATT: "MAT", MRK: "MRK", MARK: "MRK", LUK: "LUK", LUKE: "LUK", JHN: "JHN", JOHN: "JHN",
  ACT: "ACT", ACTS: "ACT", ROM: "ROM", "1CO": "1CO", "1COR": "1CO", "2CO": "2CO", GAL: "GAL",
  EPH: "EPH", PHP: "PHP", PHIL: "PHP", COL: "COL", "1TH": "1TH", "2TH": "2TH", "1TI": "1TI",
  "1TIM": "1TI", "2TI": "2TI", TIT: "TIT", PHM: "PHM", HEB: "HEB", JAS: "JAS", "1PE": "1PE",
  "1PET": "1PE", "2PE": "2PE", "1JN": "1JN", "1JO": "1JN", "2JN": "2JN", "3JN": "3JN", JUDE: "JUD",
  JUD: "JUD", REV: "REV",
  // OSIS (BDB)
  EXOD: "EXO", DEUT: "DEU", JOSH: "JOS", JUDG: "JDG", RUTH: "RUT", "1SAM": "1SA", "2SAM": "2SA",
  "1KGS": "1KI", "2KGS": "2KI", "1CHR": "1CH", "2CHR": "2CH", EZRA: "EZR", ESTH: "EST", PS: "PSA",
  PROV: "PRO", ECCL: "ECC", SONG: "SNG", EZEK: "EZK", JOEL: "JOL", AMOS: "AMO", OBAD: "OBA",
  JONAH: "JON", NAH: "NAM", ZEPH: "ZEP", ZECH: "ZEC",
};

// "Jhn.13.35, 36; 14.2" / "Ps.10.16" → "JHN.13.35" (first verse only), or null for apocrypha etc.
function refKey(raw) {
  const m = /^([1-4]?[A-Za-z]+)\.(\d+)\.(\d+)/.exec(raw.trim());
  if (!m) return null;
  const id = BOOK_ALIASES[m[1].toUpperCase()];
  return id ? `${id}.${m[2]}.${m[3]}` : null;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const decode = (s) => s
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&");

// ── Part of speech from STEPBible morph codes (H:N-M, G:V, N:N-M-P, A:V …) ──
const TYPES = {
  A: "Adjective", ADV: "Adverb", Adv: "Adverb", Art: "Article", Cond: "Conditional", COND: "Conditional",
  Conj: "Conjunction", CONJ: "Conjunction", Cor: "Correlative", D: "Demonstrative", DemP: "Demonstrative pronoun",
  ImpP: "Impersonal pronoun", Intg: "Interrogative", Intj: "Interjection", INJ: "Interjection", N: "Noun",
  Neg: "Negative", Part: "Particle", PRT: "Particle", Prep: "Preposition", PREP: "Preposition",
  PerP: "Personal pronoun", P: "Personal pronoun", PosP: "Possessive pronoun", RefP: "Reflexive pronoun",
  RelP: "Relative pronoun", V: "Verb",
};
const GENDERS = { M: "masculine", F: "feminine", N: "neuter", C: "common" };
const NAME_KINDS = { P: "person", L: "place", LG: "people group", PG: "people group", T: "title" };

function posLabel(morph) {
  const first = morph.split(/\s*[/+]\s*/)[0].trim();
  const m = /^([A-Z]):([A-Za-z]+)(?:-([A-Z/]*))?(?:-([A-Z]+))?/.exec(first);
  if (!m) return undefined;
  const [, lang, type, gender = "", extra] = m;
  const parts = [];
  if (lang === "N") {
    parts.push("Proper name");
    if (extra && NAME_KINDS[extra]) parts.push(NAME_KINDS[extra]);
  } else {
    parts.push(TYPES[type] ?? type);
    const g = gender.split("/").map(x => GENDERS[x]).filter(Boolean).join("/");
    if (g) parts.push(g);
  }
  if (lang === "A") parts.push("Aramaic");
  return parts.join(" · ");
}

// STEPBible lexicon rows: eStrong, dStrong, uStrong, lemma, xlit, morph, gloss, meaning
// "H5892a" / "H5892b" split Strong's homonyms (excitement / city). Keep the one that matches
// Strong's own definition, else the one with the most sub-entries (the commoner word).
function parseStepRows(text, dict) {
  const groups = new Map(); // id → Map(letter → { first row, count })
  for (const line of text.split("\n")) {
    const cols = line.split("\t");
    const m = /^([HG])0*(\d+)([a-z]?)$/.exec(cols[0] ?? "");
    if (!m || cols.length < 8) continue;
    const id = m[1] + m[2];
    const byLetter = groups.get(id) ?? new Map();
    groups.set(id, byLetter);
    const g = byLetter.get(m[3]);
    if (g) { g.count++; continue; }
    byLetter.set(m[3], { letter: m[3], count: 1, morph: cols[5].trim(), gloss: cols[6].trim(), meaning: cols[7] });
  }
  const rows = new Map();
  for (const [id, byLetter] of groups) {
    const def = (dict[id]?.def ?? "").toLowerCase();
    let best = null, bestScore = -1;
    for (const g of byLetter.values()) {
      const head = g.gloss.split(/[:(]/)[0].replace(/^to /, "").trim().toLowerCase();
      const score = (head && def.includes(head) ? 1000 : 0) + g.count;
      if (score > bestScore) { best = g; bestScore = score; }
    }
    rows.set(id, best);
  }
  return rows;
}

// ── Abbott-Smith (TBESG meaning column) → lines of segments ──
function parseInline(html) {
  const segs = [];
  let b = 0, i = 0;
  const re = /<ref='([^']*)'>(.*?)<\/ref>|<(\/?)(b|i)>|<[^>]+>|([^<]+)/gs;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      const t = decode(m[2].replace(/<[^>]+>/g, "")).replace(/\.$/, "");
      const r = refKey(m[1]);
      segs.push(r ? { t, r } : { t });
    } else if (m[4]) {
      if (m[4] === "b") b += m[3] ? -1 : 1; else i += m[3] ? -1 : 1;
    } else if (m[5] !== undefined) {
      const t = decode(m[5]);
      const seg = { t };
      if (b > 0) seg.b = 1;
      if (i > 0) seg.i = 1;
      segs.push(seg);
    }
  }
  // merge neighbours with identical styling, trim edges
  const out = [];
  for (const s of segs) {
    const prev = out[out.length - 1];
    if (prev && !prev.r && !s.r && !!prev.b === !!s.b && !!prev.i === !!s.i) prev.t += s.t;
    else out.push({ ...s });
  }
  for (const s of out) s.t = s.t.replace(/\s+/g, " ");
  if (out.length) { out[0].t = out[0].t.replace(/^\s+/, ""); out[out.length - 1].t = out[out.length - 1].t.replace(/\s+$/, ""); }
  return out.filter(s => s.t);
}

function abbottSmithLines(meaning) {
  let html = meaning
    .replace(/<note>.*?<\/note>/gs, "")
    .replace(/\s*\(AS\)\s*$/, "")
    .replace(/\s*\(MD\)\s*$/, "")
    .replace(/†/g, "")
    .replace(/<\/?re>/g, "");
  const lines = [];
  for (let chunk of html.split(/<br\s*\/?>/i)) {
    chunk = chunk.trim();
    if (!chunk) continue;
    // "__1." / "__(a)" / "__(i)" / "__I." mark sense levels
    let d = 0;
    const lm = /^__\s*(\S+?)\s/.exec(chunk + " ");
    if (lm) {
      const tag = lm[1];
      d = /^\([a-z]\)$/.test(tag) ? 2 : /^\((?:[ivx]+|\d+)\)$/.test(tag) ? 3 : /^[IVX]+\.$/.test(tag) ? 0 : 1;
      chunk = chunk.replace(/^__\s*/, "");
    }
    const s = parseInline(chunk);
    if (s.length) lines.push({ d, s });
  }
  return lines;
}

// ── Minimal XML → tree (BDB / LexicalIndex are well-formed) ──
function parseXml(xml) {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([\w:]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[5] !== undefined) { stack[stack.length - 1].children.push(decode(m[5])); continue; }
    if (!m[2]) continue;
    if (m[1]) { stack.pop(); continue; }
    const attrs = {};
    for (const a of m[3].matchAll(/([\w:]+)="([^"]*)"/g)) attrs[a[1]] = decode(a[2]);
    const node = { tag: m[2], attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!m[4]) stack.push(node);
  }
  return root;
}

function* walk(node, tag) {
  for (const c of node.children) {
    if (typeof c === "string") continue;
    if (c.tag === tag) yield c;
    yield* walk(c, tag);
  }
}
const textOf = (n) => typeof n === "string" ? n : n.children.map(textOf).join("");

// BDB's abbreviated verb stems → full names (rarer ones are left as written)
const STEMS = {
  Hiph: "Hiphil", Niph: "Niphal", Pi: "Piel", Pu: "Pual", Hithp: "Hithpael", Hoph: "Hophal",
  Pe: "Peal", Pa: "Pael", Haph: "Haphel", Pilp: "Pilpel", Hithpe: "Hithpeel", Hithpa: "Hithpaal",
  Po: "Poel", Hithpo: "Hithpoel", Hithpalp: "Hithpalpel", Hothp: "Hothpaal", Hithpol: "Hithpolel",
  "Qal pass": "Qal passive",
};

// BDB entry → outline: stems (Qal, Piel…) and numbered senses with their <def>s and a few refs
function bdbLines(entry) {
  const lines = [];
  const MAX_REFS = 3;

  function collect(node) {
    const defs = [], refs = [];
    for (const c of node.children) {
      if (typeof c === "string" || c.tag === "sense") continue;
      if (c.tag === "def") defs.push(textOf(c).trim());
      else if (c.tag === "ref" && refs.length < MAX_REFS) {
        const r = refKey(c.attrs.r ?? "");
        if (r) refs.push({ t: textOf(c).trim(), r });
      } else { const sub = collect(c); defs.push(...sub.defs); refs.push(...sub.refs.slice(0, MAX_REFS - refs.length)); }
    }
    return { defs: [...new Set(defs.filter(Boolean))], refs };
  }

  function senseLine(node, d) {
    const firstEl = node.children.find(c => typeof c !== "string" || c.trim());
    const stem = firstEl && typeof firstEl !== "string" && firstEl.tag === "stem" ? firstEl : null;
    const hasSubs = node.children.some(c => typeof c !== "string" && c.tag === "sense");
    const { defs, refs } = collect(node);
    if (!defs.length && !stem) {
      // no <def>: fall back to the sense's own short gloss, e.g. "pl. in number."
      const own = node.children
        .filter(c => typeof c === "string" || !["sense", "ref", "w"].includes(c.tag))
        .map(textOf).join("").replace(/\s+/g, " ").replace(/^[\s.,;:—=]+|[\s.,;:—=]+$/g, "");
      const clean = own.replace(/\(\s*(?:sq\.|cf\.)?\s*\)/g, "").replace(/\s+([,;.])/g, "$1").trim();
      if (clean && clean.length <= 80) defs.push(clean);
    }
    const s = [];
    if (stem) { const st = textOf(stem).trim(); s.push({ t: STEMS[st] ?? st, b: 1 }); }
    if (node.attrs.n) s.push({ t: `${node.attrs.n}.`, b: 1 });
    if (defs.length) s.push({ t: defs.join(", ") });
    if (defs.length && refs.length) {
      s.push({ t: " —" });
      refs.forEach((r, i) => s.push(i ? { t: ", " } : { t: " " }, r));
    }
    // separate label from text with a space
    const segs = s.flatMap((x, i) => i && !x.r && !x.t.startsWith(" ") && !x.t.startsWith(",") ? [{ t: " " }, x] : [x]);
    if (defs.length || stem || (node.attrs.n && hasSubs)) lines.push({ d, s: mergeSegs(segs) });
    for (const c of node.children) {
      if (typeof c !== "string" && c.tag === "sense") senseLine(c, stem || node.attrs.n ? d + 1 : d);
    }
  }

  const head = collect(entry);
  if (head.defs.length) lines.push({ d: 0, s: [{ t: head.defs.join(", "), b: 1 }] });
  for (const c of entry.children) {
    if (typeof c !== "string" && c.tag === "sense") senseLine(c, 0);
  }
  return lines;
}

function mergeSegs(segs) {
  const out = [];
  for (const s of segs) {
    const prev = out[out.length - 1];
    if (prev && !prev.r && !s.r && !!prev.b === !!s.b && !!prev.i === !!s.i) prev.t += s.t;
    else out.push({ ...s });
  }
  return out;
}

// ── Word family from Strong's derivation text ──
function familyFrom(dict) {
  const parents = {};
  const kids = {};
  for (const [id, e] of Object.entries(dict)) {
    if (!e.derivation) continue;
    // ignore "Compare …" / "See …" asides — those aren't derivations
    const main = e.derivation.split(/\b(?:[Cc]ompare|[Ss]ee|[Cc]f\.)\b/)[0];
    const ps = [...new Set(main.match(/[HG]\d+/g) ?? [])].filter(p => p !== id && dict[p]);
    if (!ps.length) continue;
    parents[id] = ps;
    for (const p of ps) (kids[p] ??= []).push(id);
  }
  const num = (x) => parseInt(x.slice(1), 10);
  for (const k of Object.values(kids)) k.sort((a, b) => num(a) - num(b));
  return { parents, kids };
}

function attachFamily(out, dict) {
  const { parents, kids } = familyFrom(dict);
  for (const id of Object.keys(dict)) {
    if (!parents[id] && !kids[id]) continue;
    out[id] ??= {};
    if (parents[id]) out[id].f = parents[id];
    if (kids[id]) out[id].k = kids[id];
  }
}

async function main() {
  const greekDict = JSON.parse(readFileSync(join(ROOT, "lib/strongs-greek.json"), "utf-8"));
  const hebrewDict = JSON.parse(readFileSync(join(ROOT, "lib/strongs-hebrew.json"), "utf-8"));

  console.log("Downloading sources…");
  const [tbesg, tbesh, bdbXml, liXml] = await Promise.all([
    fetchText(TBESG_URL), fetchText(TBESH_URL),
    fetchText(OSHB + "BrownDriverBriggs.xml"), fetchText(OSHB + "LexicalIndex.xml"),
  ]);

  // Greek
  const greek = {};
  for (const [id, row] of parseStepRows(tbesg, greekDict)) {
    if (!id.startsWith("G") || !greekDict[id]) continue;
    const e = { g: row.gloss };
    const p = posLabel(row.morph);
    if (p) e.p = p;
    const s = abbottSmithLines(row.meaning);
    if (s.length) e.s = s;
    greek[id] = e;
  }
  attachFamily(greek, greekDict);

  // Hebrew: gloss/pos from TBESH, outline from BDB via the lexical index
  const hebrew = {};
  const tbeshRows = parseStepRows(tbesh, hebrewDict);
  for (const [id, row] of tbeshRows) {
    if (!id.startsWith("H") || !hebrewDict[id]) continue;
    const e = { g: row.gloss };
    const p = posLabel(row.morph);
    if (p) e.p = p;
    hebrew[id] = e;
  }

  const bdbEntries = new Map();
  for (const e of walk(parseXml(bdbXml), "entry")) bdbEntries.set(e.attrs.id, e);

  // Strong's number → BDB id; prefer the un-augmented xref, then the homonym chosen from TBESH
  const strongToBdb = new Map();
  for (const x of walk(parseXml(liXml), "xref")) {
    const { strong, bdb, aug } = x.attrs;
    if (!strong || !/^\d+$/.test(strong) || !bdb) continue;
    const id = "H" + strong;
    const want = tbeshRows.get(id)?.letter || "a";
    const rank = !aug ? 0 : aug === want ? 1 : 2;
    const cur = strongToBdb.get(id);
    if (!cur || rank < cur.rank) strongToBdb.set(id, { bdb, rank });
  }

  let bdbHits = 0;
  for (const [id, { bdb }] of strongToBdb) {
    if (!hebrewDict[id]) continue;
    const entry = bdbEntries.get(bdb);
    if (!entry) continue;
    const s = bdbLines(entry);
    // many OSHB entries are still "base" stubs — a lone gloss line adds nothing over TBESH's gloss
    if (!s.length || (s.length === 1 && !s[0].s.some(x => x.r))) continue;
    (hebrew[id] ??= {}).s = s;
    bdbHits++;
  }
  attachFamily(hebrew, hebrewDict);

  writeFileSync(join(ROOT, "lib/data/strongs-lexicon-greek.json"), JSON.stringify(greek));
  writeFileSync(join(ROOT, "lib/data/strongs-lexicon-hebrew.json"), JSON.stringify(hebrew));

  const withDefs = (o) => Object.values(o).filter(e => e.s).length;
  console.log(`Greek:  ${Object.keys(greek).length} entries, ${withDefs(greek)} with Abbott-Smith (of ${Object.keys(greekDict).length})`);
  console.log(`Hebrew: ${Object.keys(hebrew).length} entries, ${bdbHits} with BDB (of ${Object.keys(hebrewDict).length})`);
}

main().catch((err) => { console.error(err); process.exit(1); });
