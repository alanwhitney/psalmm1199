import greekDict from "./strongs-greek.json";
import hebrewDict from "./strongs-hebrew.json";

export interface StrongsEntry {
  lemma: string;
  def?: string;
  xlit?: string;
  derivation?: string;
}

const GREEK_MAP: Record<string, string> = {
  'α':'a','ά':'a','ὰ':'a','ᾶ':'a','ἀ':'a','ἁ':'ha','ἄ':'a','ἅ':'ha','ἂ':'a','ἃ':'ha','ἆ':'a','ἇ':'ha',
  'ᾳ':'ai','ᾴ':'ai','ᾲ':'ai','ᾷ':'ai','ᾀ':'ai','ᾁ':'hai','ᾄ':'ai','ᾅ':'hai',
  'β':'b','γ':'g','δ':'d',
  'ε':'e','έ':'e','ὲ':'e','ἐ':'e','ἑ':'he','ἔ':'e','ἕ':'he','ἒ':'e','ἓ':'he',
  'ζ':'z',
  'η':'ē','ή':'ē','ὴ':'ē','ῆ':'ē','ἠ':'ē','ἡ':'hē','ἤ':'ē','ἥ':'hē','ἢ':'ē','ἣ':'hē','ἦ':'ē','ἧ':'hē',
  'ῃ':'ēi','ῄ':'ēi','ῂ':'ēi','ῇ':'ēi',
  'θ':'th',
  'ι':'i','ί':'i','ὶ':'i','ῖ':'i','ἰ':'i','ἱ':'hi','ἴ':'i','ἵ':'hi','ἲ':'i','ἳ':'hi','ἶ':'i','ἷ':'hi','ϊ':'i','ΐ':'i',
  'κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x',
  'ο':'o','ό':'o','ὸ':'o','ὀ':'o','ὁ':'ho','ὄ':'o','ὅ':'ho','ὂ':'o','ὃ':'ho',
  'π':'p','ρ':'r','ῤ':'r','ῥ':'rh','σ':'s','ς':'s','τ':'t',
  'υ':'y','ύ':'y','ὺ':'y','ῦ':'y','ὐ':'y','ὑ':'hy','ὔ':'y','ὕ':'hy','ὒ':'y','ὓ':'hy','ὖ':'y','ὗ':'hy','ϋ':'y','ΰ':'y',
  'φ':'ph','χ':'ch','ψ':'ps',
  'ω':'ō','ώ':'ō','ὼ':'ō','ῶ':'ō','ὠ':'ō','ὡ':'hō','ὤ':'ō','ὥ':'hō','ὢ':'ō','ὣ':'hō','ὦ':'ō','ὧ':'hō',
  'ῳ':'ōi','ῴ':'ōi','ῲ':'ōi','ῷ':'ōi',
  'Α':'A','Β':'B','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'Ē','Θ':'Th',
  'Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P',
  'Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'Ph','Χ':'Ch','Ψ':'Ps','Ω':'Ō',
  'Ἀ':'A','Ἁ':'Ha','Ἄ':'A','Ἅ':'Ha','Ἂ':'A','Ἃ':'Ha','Ἆ':'A','Ἇ':'Ha',
  'Ἐ':'E','Ἑ':'He','Ἔ':'E','Ἕ':'He','Ἠ':'Ē','Ἡ':'Hē','Ἤ':'Ē','Ἥ':'Hē',
  'Ἰ':'I','Ἱ':'Hi','Ἴ':'I','Ἵ':'Hi','Ὀ':'O','Ὁ':'Ho','Ὄ':'O','Ὅ':'Ho',
  'Ὑ':'Hy','Ὕ':'Hy','Ὓ':'Hy','Ὗ':'Hy','Ὠ':'Ō','Ὡ':'Hō','Ὤ':'Ō','Ὥ':'Hō',
};

function transliterateGreek(text: string): string {
  return Array.from(text).map(ch => GREEK_MAP[ch] ?? ch).join('');
}

export function lookupStrongs(id: string): StrongsEntry | null {
  if (id.startsWith("G")) {
    const entry = (greekDict as Record<string, StrongsEntry>)[id] ?? null;
    if (!entry) return null;
    return entry.xlit ? entry : { ...entry, xlit: transliterateGreek(entry.lemma) };
  }
  if (id.startsWith("H")) return (hebrewDict as Record<string, StrongsEntry>)[id] ?? null;
  return null;
}
