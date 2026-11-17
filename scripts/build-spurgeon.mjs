// Builds public/commentary/spurgeon/{psalm}.json from CrossWire's SWORD
// module of C. H. Spurgeon's Treasury of David (public domain).
//
//   curl -LO https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/TDavid.zip
//   unzip TDavid.zip -d tdavid
//   node scripts/build-spurgeon.mjs tdavid
//
// The module is zCom4: ot.bzs lists zlib blocks (offset, size, uncompressed
// size; u32 LE each), ot.bzv indexes every KJV OT verse slot (block, offset,
// size; u32 LE each), ot.bzz holds the compressed blocks. Each psalm's whole
// commentary sits in its verse-1 slot, right after its chapter heading slot.
//
// Output per psalm: { sections: [{ h, p: [{ v?: [start, end], s: Seg[] }] }] }
// where Seg = { t, b?: 1, i?: 1 } — the same segment shape as the lexicon.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { inflateSync } from "zlib";

const root = process.argv[2];
if (!root) {
  console.error("usage: node scripts/build-spurgeon.mjs <unzipped TDavid dir>");
  process.exit(1);
}
const dir = join(root, "modules/comments/zcom/tdavid");
const bzs = readFileSync(join(dir, "ot.bzs"));
const bzv = readFileSync(join(dir, "ot.bzv"));
const bzz = readFileSync(join(dir, "ot.bzz"));

const blocks = [];
for (let i = 0; i < bzs.length; i += 12) {
  const off = bzs.readUInt32LE(i);
  const size = bzs.readUInt32LE(i + 4);
  blocks.push(inflateSync(bzz.subarray(off, off + size)));
}
const slots = bzv.length / 12;
function entry(i) {
  const b = bzv.readUInt32LE(i * 12);
  const off = bzv.readUInt32LE(i * 12 + 4);
  const size = bzv.readUInt32LE(i * 12 + 8);
  return size ? blocks[b].subarray(off, off + size).toString("utf8") : "";
}

// Group slot text by psalm: a chapter heading slot starts each psalm.
const psalms = {};
let current = null;
for (let i = 0; i < slots; i++) {
  const text = entry(i);
  const head = text.match(/<chapter[^>]*osisID="Ps\.(\d+)"/);
  if (head) { current = Number(head[1]); psalms[current] = ""; continue; }
  if (current && text) psalms[current] += text + " ";
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) => s.replace(/&(\w+);/g, (m, e) => ENTITIES[e] ?? m);

// "Verse 1." / "Verses 1-3." / "Verse 1, 2." / "Verses 3 to 5." / "Ver. 2." (Psalm 119)
const VERSE_MARK = /^(?:Verses?|Vers?\.)\s*(\d+)((?:\s*(?:-|–|,|to|and)\s*\d+)*)\.?\s*/i;
// Sections whose paragraphs are tagged by verse
const VERSED = /EXPOSITION|EXPLANATORY|HINTS|^Verses?\s/i;

function titleCase(h) {
  const t = h.replace(/\.$/, "").trim();
  if (t !== t.toUpperCase()) return t;
  return t.toLowerCase().replace(/(^|\s)(\w)/g, (_, s, c) => s + c.toUpperCase())
    .replace(/\b(And|To|The|Upon|Of)\b/g, (w, _, i) => (i === 0 ? w : w.toLowerCase()));
}

function parsePsalm(osis) {
  const sections = [];
  let section = null;
  let para = null;
  let bold = 0, italic = 0;
  let inTitle = false, titleText = "";
  const hiStack = [];

  const startSection = (h) => { section = { h, p: [] }; sections.push(section); para = null; };
  const endPara = () => {
    if (!para) return;
    para.s = para.s.filter((s) => s.t.trim());
    if (para.s.length) {
      para.s[0].t = para.s[0].t.trimStart();
      para.s[para.s.length - 1].t = para.s[para.s.length - 1].t.trimEnd();
      section.p.push(para);
    }
    para = null;
  };
  const addText = (raw) => {
    const t = decode(raw).replace(/\s+/g, " ");
    if (!t.trim() && !para) return;
    if (!section) startSection("Overview");
    if (!para) para = { s: [] };
    const last = para.s[para.s.length - 1];
    const style = { ...(bold ? { b: 1 } : {}), ...(italic ? { i: 1 } : {}) };
    if (last && !!last.b === !!style.b && !!last.i === !!style.i) last.t += t;
    else para.s.push({ t, ...style });
  };

  for (const tok of osis.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (tok[0] !== "<") {
      if (inTitle) titleText += tok;
      else addText(tok);
      continue;
    }
    const name = tok.match(/^<\/?(\w+)/)?.[1];
    const closing = tok.startsWith("</");
    if (name === "title") {
      if (!closing) { inTitle = true; titleText = ""; continue; }
      inTitle = false;
      const h = decode(titleText).trim();
      if (h && !/OVERVIEW$/.test(h)) { endPara(); startSection(titleCase(h)); }
      continue;
    }
    if (name === "hi") {
      if (closing) {
        const t = hiStack.pop();
        if (t === "bold") bold--; else if (t === "italic") italic--;
      } else {
        const t = tok.match(/type="(\w+)"/)?.[1];
        hiStack.push(t);
        if (t === "bold") bold++; else if (t === "italic") italic++;
      }
      continue;
    }
    if (name === "div" && /type="x-p"/.test(tok)) { endPara(); continue; }
    if (name === "item" || name === "lg") { endPara(); continue; }
    if (name === "l" && (closing || /eID=/.test(tok))) { if (para) addText("\n"); continue; }
    // milestones, chapter, reference, list: text passes through
  }
  endPara();

  // Tag paragraphs with the verse they discuss
  for (const sec of sections) {
    if (!VERSED.test(sec.h)) continue;
    let v = null;
    for (const p of sec.p) {
      const first = p.s[0];
      const m = first.t.match(VERSE_MARK);
      if (m && first.b) {
        const nums = [Number(m[1]), ...(m[2].match(/\d+/g) ?? []).map(Number)];
        v = [Math.min(...nums), Math.max(...nums)];
      } else if (/^Whole Psalm/i.test(first.t)) {
        v = null;
      }
      if (v) p.v = v;
    }
    // Psalm 119 gives every verse its own Exposition/Notes/Hints sections
    const first = sec.p[0]?.v;
    if (first && sec.p.every((p) => p.v && p.v[0] === first[0] && p.v[1] === first[1])) sec.v = first;
  }
  // Join line breaks from poetry back into tidy text
  for (const sec of sections) for (const p of sec.p) for (const s of p.s) s.t = s.t.replace(/ *\n */g, "\n");
  return sections.filter((s) => s.p.length);
}

const outDir = "public/commentary/spurgeon";
mkdirSync(outDir, { recursive: true });
let bytes = 0;
for (const [n, osis] of Object.entries(psalms)) {
  const sections = parsePsalm(osis);
  const json = JSON.stringify({ sections });
  bytes += json.length;
  writeFileSync(join(outDir, `${n}.json`), json);
}
console.log(`Wrote ${Object.keys(psalms).length} psalms, ${(bytes / 1e6).toFixed(1)} MB`);
