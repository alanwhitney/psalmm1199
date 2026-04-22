"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, Loader2 } from "lucide-react";
import { Translation } from "@/types";

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  bgOverlay: "#222228",
  border: "#2a2a32",
  borderDefault: "#3a3a46",
  gold: "#c9a84c",
  goldMuted: "#8a6e2f",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

interface SearchResult {
  id: string;
  reference: string;
  text: string;
  bookId: string;
  chapter: number;
  verse: number;
}

interface SearchPanelProps {
  translation: Translation;
  currentBookId: string;
  currentChapter: number;
  verses: { number: number; text: string }[];
  onClose: () => void;
  onHighlightVerse: (verse: number | null) => void;
}

export default function SearchPanel({
  translation,
  currentBookId,
  currentChapter,
  verses,
  onClose,
  onHighlightVerse,
}: SearchPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"bible" | "chapter">("bible");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [chapterMatches, setChapterMatches] = useState<{ number: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const searchChapter = useCallback((q: string) => {
    if (!q.trim()) { setChapterMatches([]); onHighlightVerse(null); return; }
    const lower = q.toLowerCase();
    const matches = verses.filter(v => v.text.toLowerCase().includes(lower));
    setChapterMatches(matches);
    if (matches.length === 1) onHighlightVerse(matches[0].number);
    else onHighlightVerse(null);
  }, [verses, onHighlightVerse]);

  const searchBible = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&t=${translation}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [translation]);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (scope === "chapter") searchChapter(value);
      else searchBible(value);
    }, 400);
  }

  function handleScopeChange(s: "bible" | "chapter") {
    setScope(s);
    setResults([]);
    setChapterMatches([]);
    setSearched(false);
    onHighlightVerse(null);
    if (query.trim()) {
      if (s === "chapter") searchChapter(query);
      else searchBible(query);
    }
  }

  function goToResult(result: SearchResult) {
    onClose();
    router.push(`/bible/${result.bookId}/${result.chapter}?t=${translation}#v${result.verse}`);
  }

  function highlightMatch(text: string, q: string) {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: `${C.gold}40`, color: C.textPrimary, borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 480,
        background: C.bgRaised, borderLeft: `1px solid ${C.border}`,
        zIndex: 51, display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={16} color={C.textMuted} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Search scripture…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15, color: C.textPrimary, fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setChapterMatches([]); onHighlightVerse(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2 }}>
              <X size={15} />
            </button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Scope toggle */}
        <div style={{ display: "flex", padding: "10px 16px", gap: 8, borderBottom: `1px solid ${C.border}` }}>
          {([["bible", "Full Bible"], ["chapter", "This Chapter"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleScopeChange(key)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${scope === key ? C.gold : C.border}`,
                background: scope === key ? `${C.gold}18` : C.bgOverlay,
                color: scope === key ? C.gold : C.textSecondary,
              }}
            >{label}</button>
          ))}
          <span style={{ fontSize: 11, color: C.textMuted, alignSelf: "center", marginLeft: 4 }}>{translation}</span>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10, color: C.textMuted }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Searching…</span>
            </div>
          )}

          {/* Chapter results */}
          {!loading && scope === "chapter" && chapterMatches.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: C.textMuted, padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                {chapterMatches.length} match{chapterMatches.length !== 1 ? "es" : ""} in this chapter
              </p>
              {chapterMatches.map(v => (
                <button
                  key={v.number}
                  onClick={() => { onHighlightVerse(v.number); onClose(); }}
                  style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                >
                  <p style={{ fontSize: 11, color: C.gold, fontWeight: 700, margin: "0 0 4px" }}>Verse {v.number}</p>
                  <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
                    {highlightMatch(v.text.replace(/\n/g, " "), query)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Chapter no results */}
          {!loading && scope === "chapter" && query.trim() && chapterMatches.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: C.textMuted }}>
              <p style={{ fontSize: 13 }}>No matches in this chapter</p>
            </div>
          )}

          {/* Bible results */}
          {!loading && scope === "bible" && results.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: C.textMuted, padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => goToResult(r)}
                  style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <BookOpen size={11} color={C.gold} />
                    <p style={{ fontSize: 11, color: C.gold, fontWeight: 700, margin: 0 }}>{r.reference}</p>
                  </div>
                  <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
                    {highlightMatch(r.text.replace(/\n/g, " "), query)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Bible no results */}
          {!loading && scope === "bible" && searched && results.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: C.textMuted }}>
              <p style={{ fontSize: 13 }}>No results found for "{query}"</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Try different keywords or check the spelling</p>
            </div>
          )}

          {/* Empty state */}
          {!query && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: C.textMuted }}>
              <Search size={28} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Type to search {scope === "chapter" ? "this chapter" : "the Bible"}</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Searching in {translation}</p>
            </div>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
