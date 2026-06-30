"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, Loader2 } from "lucide-react";
import { Translation } from "@/types";

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
  const [total, setTotal] = useState(0);
  const [chapterMatches, setChapterMatches] = useState<{ number: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const searchBible = useCallback(async (q: string, offset = 0) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); setTotal(0); return; }
    const append = offset > 0;
    if (append) setLoadingMore(true); else { setLoading(true); setSearched(true); }
    setSearchError(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&t=${translation}&offset=${offset}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const newResults: SearchResult[] = data.results ?? [];
      setTotal(data.total ?? newResults.length);
      setResults(prev => append ? [...prev, ...newResults] : newResults);
    } catch {
      setSearchError(true);
      if (!append) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
    setTotal(0);
    setChapterMatches([]);
    setSearched(false);
    setSearchError(false);
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
        <mark className="bg-gold/25 text-ink-primary rounded-[2px] px-px">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50" />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-surface-raised border-l border-l-line-subtle z-[51] flex flex-col">
        {/* Header */}
        <div className="px-4 py-[14px] border-b border-b-line-subtle flex items-center gap-[10px]">
          <Search size={16} className="text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Search scripture…"
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-ink-primary font-[inherit]"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setTotal(0); setChapterMatches([]); setSearchError(false); onHighlightVerse(null); }} className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5">
              <X size={15} />
            </button>
          )}
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scope toggle */}
        <div className="flex px-4 py-[10px] gap-2 border-b border-b-line-subtle">
          {([["bible", "Full Bible"], ["chapter", "This Chapter"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleScopeChange(key)}
              className={`px-[14px] py-[5px] rounded-full text-xs font-semibold cursor-pointer border ${
                scope === key
                  ? "border-gold bg-gold/[9%] text-gold"
                  : "border-line-subtle bg-surface-overlay text-ink-secondary"
              }`}
            >{label}</button>
          ))}
          <span className="text-[11px] text-ink-muted self-center ml-1">{translation}</span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center p-10 gap-[10px] text-ink-muted">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[13px]">Searching…</span>
            </div>
          )}

          {/* Chapter results */}
          {!loading && scope === "chapter" && chapterMatches.length > 0 && (
            <div>
              <p className="text-[11px] text-ink-muted px-4 pt-3 pb-1 uppercase tracking-[0.08em] font-semibold">
                {chapterMatches.length} match{chapterMatches.length !== 1 ? "es" : ""} in this chapter
              </p>
              {chapterMatches.map(v => (
                <button
                  key={v.number}
                  onClick={() => { onHighlightVerse(v.number); onClose(); }}
                  className="w-full text-left px-4 py-3 bg-transparent border-none border-b border-b-line-subtle cursor-pointer"
                >
                  <p className="text-[11px] text-gold font-bold mb-1">{v.number}</p>
                  <p className="text-[13px] text-ink-secondary m-0 leading-[1.6]">
                    {highlightMatch(v.text.replace(/\n/g, " "), query)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Chapter no results */}
          {!loading && scope === "chapter" && query.trim() && chapterMatches.length === 0 && (
            <div className="text-center py-12 px-6 text-ink-muted">
              <p className="text-[13px]">No matches in this chapter</p>
            </div>
          )}

          {/* Bible results */}
          {!loading && scope === "bible" && results.length > 0 && (
            <div>
              <p className="text-[11px] text-ink-muted px-4 pt-3 pb-1 uppercase tracking-[0.08em] font-semibold">
                Showing {results.length} of {total} match{total !== 1 ? "es" : ""}
              </p>
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => goToResult(r)}
                  className="w-full text-left px-4 py-3 bg-transparent border-none border-b border-b-line-subtle cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen size={11} className="text-gold" />
                    <p className="text-[11px] text-gold font-bold m-0">{r.reference}</p>
                  </div>
                  <p className="text-[13px] text-ink-secondary m-0 leading-[1.6]">
                    {highlightMatch(r.text.replace(/\n/g, " "), query)}
                  </p>
                </button>
              ))}
              {results.length < total && (
                <div className="px-4 py-4 flex justify-center">
                  <button
                    onClick={() => searchBible(query, results.length)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-[12px] font-semibold text-ink-secondary cursor-pointer disabled:opacity-50"
                  >
                    {loadingMore && <Loader2 size={13} className="animate-spin" />}
                    {loadingMore ? "Loading…" : `Show more (${total - results.length} left)`}
                  </button>
                </div>
              )}
              {searchError && results.length > 0 && (
                <p className="text-[12px] text-red-400 text-center py-2">Couldn&apos;t load more results.</p>
              )}
            </div>
          )}

          {/* Bible no results */}
          {!loading && scope === "bible" && searched && results.length === 0 && !searchError && (
            <div className="text-center py-12 px-6 text-ink-muted">
              <p className="text-[13px]">No results found for &quot;{query}&quot;</p>
              <p className="text-xs mt-2">Try different keywords or check the spelling</p>
            </div>
          )}

          {/* Bible search error */}
          {!loading && scope === "bible" && searched && searchError && results.length === 0 && (
            <div className="text-center py-12 px-6">
              <p className="text-[13px] text-red-400 m-0">Search failed.</p>
              <button onClick={() => searchBible(query)} className="mt-3 text-[12px] text-gold-muted bg-transparent border-none cursor-pointer underline font-semibold">
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!query && (
            <div className="text-center py-12 px-6 text-ink-muted">
              <Search size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-[13px]">Type to search {scope === "chapter" ? "this chapter" : "the Bible"}</p>
              <p className="text-xs mt-1.5">Searching in {translation}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
