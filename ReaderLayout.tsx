"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Menu, X, LogIn, LogOut, Bookmark } from "lucide-react";
import { Book, Translation } from "@/types";
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS } from "@/lib/books";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

interface ReaderLayoutProps {
  book: Book;
  chapter: number;
  translation: Translation;
  user: { id: string; email?: string } | null;
  children: React.ReactNode;
}

const TRANSLATIONS: Translation[] = ["KJV", "NKJV"];

export default function ReaderLayout({
  book,
  chapter,
  translation,
  user,
  children,
}: ReaderLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  function goTo(bookId: string, ch: number, t: Translation = translation) {
    router.push(`/bible/${bookId}/${ch}?t=${t}`);
    setSidebarOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ── Sidebar ── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 bg-surface-raised border-r border-border-subtle flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:flex"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
          <Link href="/" className="flex items-center gap-2 group">
            <BookOpen className="w-5 h-5 text-gold" />
            <span className="text-sm font-semibold text-text-primary tracking-wide">
              Psalm 119:9
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-text-muted hover:text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Translation switcher */}
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
            Translation
          </p>
          <div className="flex gap-2">
            {TRANSLATIONS.map((t) => (
              <button
                key={t}
                onClick={() => goTo(book.id, chapter, t)}
                className={clsx(
                  "flex-1 py-1.5 text-xs rounded font-semibold transition-colors",
                  t === translation
                    ? "bg-gold text-surface"
                    : "bg-surface-overlay text-text-secondary hover:text-text-primary border border-border-subtle"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Book list */}
        <div className="flex-1 overflow-y-auto py-2">
          {[
            { label: "Old Testament", books: OT_BOOKS },
            { label: "New Testament", books: NT_BOOKS },
          ].map(({ label, books }) => (
            <div key={label}>
              <p className="px-4 pt-4 pb-1 text-[10px] uppercase tracking-widest text-text-muted font-medium">
                {label}
              </p>
              {books.map((b) => (
                <BookItem
                  key={b.id}
                  b={b}
                  active={b.id === book.id}
                  activeChapter={b.id === book.id ? chapter : null}
                  translation={translation}
                  onSelect={(ch) => goTo(b.id, ch)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* User section */}
        <div className="border-t border-border-subtle px-4 py-3">
          {user ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-primary truncate max-w-[160px]">{user.email}</p>
                <Link
                  href="/bookmarks"
                  className="text-[11px] text-text-muted hover:text-gold flex items-center gap-1 mt-0.5"
                >
                  <Bookmark className="w-3 h-3" /> My bookmarks
                </Link>
              </div>
              <button onClick={handleSignOut} className="text-text-muted hover:text-text-secondary">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-gold transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in to save progress
            </Link>
          )}
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-raised shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-text-muted hover:text-text-primary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-text-primary">
              {book.name}{" "}
              <span className="text-text-muted font-normal">{chapter}</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-overlay text-gold border border-gold-muted font-semibold">
              {translation}
            </span>
          </div>

          {/* Prev / Next chapter */}
          <div className="flex items-center gap-1">
            {prevChapter ? (
              <Link
                href={`/bible/${book.id}/${prevChapter}?t=${translation}`}
                className="p-1.5 rounded hover:bg-surface-overlay text-text-muted hover:text-text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 text-text-muted opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}
            <span className="text-xs text-text-muted px-1">
              {chapter} / {book.chapters}
            </span>
            {nextChapter ? (
              <Link
                href={`/bible/${book.id}/${nextChapter}?t=${translation}`}
                className="p-1.5 rounded hover:bg-surface-overlay text-text-muted hover:text-text-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 text-text-muted opacity-30">
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </header>

        {/* Chapter content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// ── Book item with expandable chapter list ──
function BookItem({
  b,
  active,
  activeChapter,
  translation,
  onSelect,
}: {
  b: Book;
  active: boolean;
  activeChapter: number | null;
  translation: Translation;
  onSelect: (ch: number) => void;
}) {
  const [expanded, setExpanded] = useState(active);

  return (
    <div>
      <button
        onClick={() => {
          setExpanded((e) => !e);
          if (!expanded) onSelect(1);
        }}
        className={clsx(
          "w-full text-left px-4 py-1.5 text-sm transition-colors flex items-center justify-between",
          active
            ? "text-gold"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <span>{b.name}</span>
        <ChevronRight
          className={clsx(
            "w-3 h-3 shrink-0 transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {Array.from({ length: b.chapters }, (_, i) => i + 1).map((ch) => (
            <button
              key={ch}
              onClick={() => onSelect(ch)}
              className={clsx(
                "w-7 h-7 text-[11px] rounded flex items-center justify-center transition-colors font-medium",
                activeChapter === ch
                  ? "bg-gold text-surface"
                  : "bg-surface-overlay text-text-secondary hover:text-text-primary hover:bg-border-subtle"
              )}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
