// Shared shape for study commentaries shown in the Study panel. Spurgeon's
// Treasury of David is prebuilt into public/commentary/spurgeon (see
// scripts/build-spurgeon.mjs); Tyndale and Matthew Henry are normalised from
// the Free Use Bible API by app/api/commentary/route.ts.

export type CommentarySeg = { t: string; b?: 1; i?: 1 };
// v: verse range the paragraph discusses; h: render as a subheading
export type CommentaryPara = { s: CommentarySeg[]; v?: [number, number]; h?: 1 };
export type CommentarySection = { h?: string; v?: [number, number]; p: CommentaryPara[] };
export type CommentaryChapter = { sections: CommentarySection[] };

export type CommentarySource = "tyndale" | "matthew-henry" | "spurgeon";

export const COMMENTARY_SOURCES: {
  id: CommentarySource;
  label: string;
  // Books the source covers; undefined = all books it has (the API 404s the rest)
  books?: string[];
  credit: { text: string; href: string; license?: { text: string; href: string } };
}[] = [
  {
    id: "tyndale",
    label: "Tyndale",
    credit: {
      text: "Tyndale Open Study Notes",
      href: "https://tyndaleopenresources.com/",
      license: { text: "CC BY-SA 4.0", href: "https://creativecommons.org/licenses/by-sa/4.0/" },
    },
  },
  {
    id: "matthew-henry",
    label: "Matthew Henry",
    credit: { text: "Matthew Henry's Commentary (public domain)", href: "https://en.wikipedia.org/wiki/Matthew_Henry%27s_Commentary" },
  },
  {
    id: "spurgeon",
    label: "Spurgeon",
    books: ["PSA"],
    credit: { text: "C. H. Spurgeon, The Treasury of David (public domain), via CrossWire", href: "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=TDavid" },
  },
];
