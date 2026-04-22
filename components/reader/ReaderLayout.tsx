"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Menu, X, LogIn, LogOut, Bookmark } from "lucide-react";
import { Book, Translation } from "@/types";
import { OT_BOOKS, NT_BOOKS } from "@/lib/books";
import { createClient } from "@/lib/supabase/client";

interface ReaderLayoutProps {
  book: Book;
  chapter: number;
  translation: Translation;
  user: { id: string; email?: string } | null;
  children: React.ReactNode;
}

const TRANSLATIONS: Translation[] = ["KJV", "NKJV", "NIV"];

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  bgOverlay: "#222228",
  border: "#2a2a32",
  gold: "#c9a84c",
  goldMuted: "#8a6e2f",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

export default function ReaderLayout({ book, chapter, translation, user, children }: ReaderLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  function goTo(bookId: string, ch: number, t: Translation = translation) {
    router.push(`/bible/${bookId}/${ch}?t=${t}`);
    setSidebarOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapters ? chapter + 1 : null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg, color: C.textPrimary }}>

      {/* Backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 30 }} />
      )}

      {/* Sidebar — hidden by default, shown when sidebarOpen */}
      {sidebarOpen && (
        <aside style={{
          width: 272, background: C.bgRaised, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", height: "100vh",
          position: "fixed", left: 0, top: 0, zIndex: 40,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: `1px solid ${C.border}` }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <BookOpen size={18} color={C.gold} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, letterSpacing: "0.03em" }}>Psalm 119:9</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          {/* Translation */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>Translation</p>
            <div style={{ display: "flex", gap: 8 }}>
              {TRANSLATIONS.map((t) => (
                <button key={t} onClick={() => goTo(book.id, chapter, t)} style={{
                  flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                  border: t !== translation ? `1px solid ${C.border}` : "none",
                  background: t === translation ? C.gold : C.bgOverlay,
                  color: t === translation ? C.bg : C.textSecondary,
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Book list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {[{ label: "Old Testament", books: OT_BOOKS }, { label: "New Testament", books: NT_BOOKS }].map(({ label, books }) => (
              <div key={label}>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMuted, fontWeight: 600, padding: "16px 16px 4px", margin: 0 }}>{label}</p>
                {books.map((b) => (
                  <BookItem key={b.id} b={b} active={b.id === book.id} activeChapter={b.id === book.id ? chapter : null} onSelect={(ch) => goTo(b.id, ch)} />
                ))}
              </div>
            ))}
          </div>

          {/* User */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160, margin: 0 }}>{user.email}</p>
                  <Link href="/bookmarks" onClick={() => setSidebarOpen(false)} style={{ fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 4, textDecoration: "none", marginTop: 2 }}>
                    <Bookmark size={11} /> My bookmarks
                  </Link>
                </div>
                <button onClick={handleSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textSecondary, textDecoration: "none" }}>
                <LogIn size={16} /> Sign in to save progress
              </Link>
            )}
          </div>
        </aside>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bgRaised, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
              <Menu size={18} />
            </button>
            <h1 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0 }}>
              {book.name} <span style={{ color: C.textMuted, fontWeight: 400 }}>{chapter}</span>
            </h1>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: C.bgOverlay, color: C.gold, border: `1px solid ${C.goldMuted}`, fontWeight: 700 }}>
              {translation}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {prevChapter
              ? <Link href={`/bible/${book.id}/${prevChapter}?t=${translation}`} style={{ padding: 6, color: C.textMuted, display: "flex", textDecoration: "none" }}><ChevronLeft size={16} /></Link>
              : <span style={{ padding: 6, opacity: 0.2, display: "flex" }}><ChevronLeft size={16} /></span>}
            <span style={{ fontSize: 11, color: C.textMuted, padding: "0 4px" }}>{chapter} / {book.chapters}</span>
            {nextChapter
              ? <Link href={`/bible/${book.id}/${nextChapter}?t=${translation}`} style={{ padding: 6, color: C.textMuted, display: "flex", textDecoration: "none" }}><ChevronRight size={16} /></Link>
              : <span style={{ padding: 6, opacity: 0.2, display: "flex" }}><ChevronRight size={16} /></span>}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
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
        onClick={() => { setExpanded(e => !e); if (!expanded) onSelect(1); }}
        style={{ width: "100%", textAlign: "left", padding: "6px 16px", background: "none", border: "none", cursor: "pointer", color: active ? C.gold : C.textSecondary, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span>{b.name}</span>
        <ChevronRight size={12} style={{ transform: expanded ? "rotate(90deg)" : undefined, transition: "transform 0.15s" }} />
      </button>
      {expanded && (
        <div style={{ padding: "4px 16px 8px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Array.from({ length: b.chapters }, (_, i) => i + 1).map((ch) => (
            <button key={ch} onClick={() => onSelect(ch)} style={{
              width: 28, height: 28, fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600,
              background: activeChapter === ch ? C.gold : C.bgOverlay,
              color: activeChapter === ch ? C.bg : C.textSecondary,
            }}>{ch}</button>
          ))}
        </div>
      )}
    </div>
  );
}
