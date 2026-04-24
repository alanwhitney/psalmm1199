"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Menu, X, LogIn, LogOut, Bookmark, StickyNote, CalendarDays, Search } from "lucide-react";
import SearchPanel from "./SearchPanel";
import { Book, Translation } from "@/types";
import { OT_BOOKS, NT_BOOKS } from "@/lib/books";
import { createClient } from "@/lib/supabase/client";

interface ReaderLayoutProps {
  book: Book;
  chapter: number;
  translation: Translation;
  user: { id: string; email?: string } | null;
  children: React.ReactNode;
  verses?: { number: number; text: string }[];
  onHighlightVerse?: (verse: number | null) => void;
}

const TRANSLATIONS: Translation[] = ["KJV", "NKJV", "NIV"];
const DESKTOP_BREAKPOINT = 1024;

export default function ReaderLayout({ book, chapter, translation, user, children, verses = [], onHighlightVerse }: ReaderLayoutProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const sidebarVisible = isDesktop || mobileOpen;

  function goTo(bookId: string, ch: number, t: Translation = translation) {
    router.push(`/bible/${bookId}/${ch}?t=${t}`);
    if (!isDesktop) setMobileOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  const sidebar = (
    <aside className={`w-[272px] min-w-[272px] bg-surface-raised border-r border-r-line-subtle flex flex-col h-screen top-0 left-0 ${isDesktop ? "relative z-[1]" : "fixed z-40"}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-b-line-subtle">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <BookOpen size={18} className="text-gold" />
          <span className="text-[13px] font-semibold text-ink-primary tracking-[0.03em]">Psalm 119:9</span>
        </Link>
        {!isDesktop && (
          <button onClick={() => setMobileOpen(false)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Translation */}
      <div className="px-4 py-3 border-b border-b-line-subtle">
        <p className="text-[10px] uppercase tracking-[0.1em] text-ink-muted mb-2 font-semibold">Translation</p>
        <div className="flex gap-2">
          {TRANSLATIONS.map((t) => (
            <button key={t} onClick={() => goTo(book.id, chapter, t)} className={`flex-1 py-1.5 text-[11px] font-bold rounded-md cursor-pointer ${
              t === translation
                ? "bg-gold text-surface border-none"
                : "bg-surface-overlay text-ink-secondary border border-line-subtle"
            }`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Book list */}
      <div className="flex-1 overflow-y-auto py-2">
        {[{ label: "Old Testament", books: OT_BOOKS }, { label: "New Testament", books: NT_BOOKS }].map(({ label, books }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-[0.1em] text-ink-muted font-semibold px-4 pt-4 pb-1 m-0">{label}</p>
            {books.map((b) => (
              <BookItem key={b.id} b={b} active={b.id === book.id} activeChapter={b.id === book.id ? chapter : null} onSelect={(ch) => goTo(b.id, ch)} />
            ))}
          </div>
        ))}
      </div>

      {/* Navigation links */}
      {user && (
        <div className="border-t border-t-line-subtle px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.1em] text-ink-muted font-semibold px-1 pt-1 pb-1.5 m-0">My Reading</p>
          {[
            { href: "/bookmarks", icon: <Bookmark size={13} />, label: "Bookmarks & Notes" },
            { href: "/bookmarks?tab=plan", icon: <CalendarDays size={13} />, label: "Reading Plan" },
            { href: "/about", icon: <BookOpen size={13} />, label: "About" },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-1 py-1.5 text-xs text-ink-secondary no-underline rounded-md">
              <span className="text-gold">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* User */}
      <div className="border-t border-t-line-subtle px-4 py-3">
        {user ? (
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px] m-0">{user.email}</p>
            <button onClick={handleSignOut} className="bg-transparent border-none cursor-pointer text-ink-muted p-1 shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="flex items-center gap-2 text-[13px] text-ink-secondary no-underline">
            <LogIn size={16} /> Sign in to save progress
          </Link>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-ink-primary">

      {/* Mobile backdrop */}
      {mobileOpen && !isDesktop && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-30" />
      )}

      {/* Sidebar */}
      {sidebarVisible && sidebar}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-[10px] border-b border-b-line-subtle bg-surface-raised shrink-0">
          <div className="flex items-center gap-3">
            {!isDesktop && (
              <button onClick={() => setMobileOpen(true)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1">
                <Menu size={18} />
              </button>
            )}
            <h1 className="text-sm font-semibold text-ink-primary m-0">
              {book.name} <span className="text-ink-muted font-normal">{chapter}</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-overlay text-gold border border-gold-muted font-bold">
              {translation}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1.5 flex items-center">
              <Search size={16} />
            </button>
            <div className="w-px h-4 bg-line-subtle" />
            {prevChapter
              ? <Link href={`/bible/${book.id}/${prevChapter}?t=${translation}`} className="p-1.5 text-ink-muted flex no-underline"><ChevronLeft size={16} /></Link>
              : <span className="p-1.5 opacity-20 flex"><ChevronLeft size={16} /></span>}
            <span className="text-[11px] text-ink-muted px-1">{chapter} / {book.chapters}</span>
            {nextChapter
              ? <Link href={`/bible/${book.id}/${nextChapter}?t=${translation}`} className="p-1.5 text-ink-muted flex no-underline"><ChevronRight size={16} /></Link>
              : <span className="p-1.5 opacity-20 flex"><ChevronRight size={16} /></span>}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Search panel */}
      {searchOpen && (
        <SearchPanel
          translation={translation}
          currentBookId={book.id}
          currentChapter={chapter}
          verses={verses}
          onClose={() => setSearchOpen(false)}
          onHighlightVerse={(v) => { onHighlightVerse?.(v); setSearchOpen(false); }}
        />
      )}
    </div>
  );
}

function BookItem({ b, active, activeChapter, onSelect }: {
  b: Book; active: boolean; activeChapter: number | null; onSelect: (ch: number) => void;
}) {
  const [expanded, setExpanded] = useState(active);
  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full text-left px-4 py-1.5 bg-transparent border-none cursor-pointer text-[13px] flex items-center justify-between ${active ? "text-gold" : "text-ink-secondary"}`}
      >
        <span>{b.name}</span>
        <ChevronRight size={12} style={{ transform: expanded ? "rotate(90deg)" : undefined, transition: "transform 0.15s" }} />
      </button>
      {expanded && (
        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1">
          {Array.from({ length: b.chapters }, (_, i) => i + 1).map((ch) => (
            <button key={ch} onClick={() => onSelect(ch)} className={`w-7 h-7 text-[11px] rounded cursor-pointer font-semibold border-none ${
              activeChapter === ch ? "bg-gold text-surface" : "bg-surface-overlay text-ink-secondary"
            }`}>{ch}</button>
          ))}
        </div>
      )}
    </div>
  );
}
