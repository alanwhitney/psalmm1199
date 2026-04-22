"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Bookmark, StickyNote, Trash2, LogOut, ChevronRight, ArrowLeft, CalendarDays } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bookmark as BookmarkType, Note } from "@/types";
import PlanTab from "./PlanTab";

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

interface Props {
  bookmarks: BookmarkType[];
  notes: Pick<Note, "id" | "book_id" | "book_name" | "chapter" | "translation" | "updated_at" | "content">[];
  userEmail: string;
  userId: string;
  userPlans: { id: string; plan_id: string; started_at: string; translation: string; active: boolean }[];
  completions: { plan_id: string; day: number }[];
}

type Tab = "bookmarks" | "notes" | "plan";

export default function BookmarksClient({ bookmarks: initial, notes, userEmail, userId, userPlans, completions }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "bookmarks");
  const [bookmarks, setBookmarks] = useState(initial);

  async function deleteBookmark(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "bookmarks", label: "Bookmarks", count: bookmarks.length },
    { key: "notes", label: "Notes", count: notes.length },
    { key: "plan", label: "Reading Plan" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.textPrimary }}>
      {/* Header */}
      <header style={{ background: C.bgRaised, borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/bible/PSA/119" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: C.textMuted, fontSize: 13 }}>
            <ArrowLeft size={15} /> Back to reading
          </Link>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} color={C.gold} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Psalm 119:9</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>{userEmail}</span>
          <button onClick={handleSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: 0 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 300, color: C.textPrimary, margin: "0 0 8px", fontFamily: "var(--font-reading, Georgia, serif)" }}>
          My Reading
        </h1>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 32px" }}>
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""} · {notes.length} note{notes.length !== 1 ? "s" : ""} · {userPlans.length} plan{userPlans.length !== 1 ? "s" : ""}
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "8px 16px", fontSize: 13, fontWeight: 600,
                color: tab === key ? C.gold : C.textMuted,
                borderBottom: tab === key ? `2px solid ${C.gold}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}{count !== undefined && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>({count})</span>}
            </button>
          ))}
        </div>

        {/* Bookmarks tab */}
        {tab === "bookmarks" && (
          bookmarks.length === 0 ? (
            <EmptyState icon={<Bookmark size={28} color={C.textMuted} />} title="No bookmarks yet" message="While reading, tap the Bookmark button to save your place in any chapter." action={{ href: "/bible/GEN/1", label: "Start reading" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bookmarks.map(bm => <BookmarkCard key={bm.id} bookmark={bm} onDelete={() => deleteBookmark(bm.id)} />)}
            </div>
          )
        )}

        {/* Notes tab */}
        {tab === "notes" && (
          notes.length === 0 ? (
            <EmptyState icon={<StickyNote size={28} color={C.textMuted} />} title="No notes yet" message="While reading, tap Add note to write thoughts on any chapter." action={{ href: "/bible/PSA/119", label: "Start reading" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notes.map(note => <NoteCard key={note.id} note={note} />)}
            </div>
          )
        )}

        {/* Plan tab */}
        {tab === "plan" && (
          <PlanTab
            userId={userId}
            initialPlans={userPlans}
            initialCompletions={completions}
            defaultTranslation="KJV"
          />
        )}
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark, onDelete }: { bookmark: BookmarkType; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.gold}15`, border: `1px solid ${C.goldMuted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bookmark size={14} color={C.gold} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px" }}>
            {bookmark.book_name} {bookmark.chapter}
            {bookmark.verse && <span style={{ color: C.textMuted, fontWeight: 400 }}>:{bookmark.verse}</span>}
          </p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
            {bookmark.translation}
            {bookmark.label && <span style={{ color: C.textSecondary }}> · "{bookmark.label}"</span>}
            <span style={{ marginLeft: 8 }}>{new Date(bookmark.created_at).toLocaleDateString()}</span>
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Link href={`/bible/${bookmark.book_id}/${bookmark.chapter}?t=${bookmark.translation}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSecondary, textDecoration: "none", padding: "6px 10px", background: C.bgOverlay, borderRadius: 6, border: `1px solid ${C.border}` }}>
          Open <ChevronRight size={12} />
        </Link>
        {confirming ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onDelete} style={{ fontSize: 11, padding: "5px 10px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 6, color: "#f87171", cursor: "pointer" }}>Remove</button>
            <button onClick={() => setConfirming(false)} style={{ fontSize: 11, padding: "5px 10px", background: C.bgOverlay, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 6, display: "flex" }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: Props["notes"][0] }) {
  const preview = note.content.length > 120 ? note.content.slice(0, 120) + "…" : note.content;
  return (
    <Link href={`/bible/${note.book_id}/${note.chapter}?t=${note.translation}&note=1`} style={{ textDecoration: "none", display: "block", background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{note.book_name} {note.chapter}</p>
        <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{new Date(note.updated_at).toLocaleDateString()}</span>
      </div>
      <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>"{preview}"</p>
      <p style={{ fontSize: 11, color: C.textMuted, margin: "8px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
        {note.translation} · Click to open <ChevronRight size={10} />
      </p>
    </Link>
  );
}

function EmptyState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action: { href: string; label: string } }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>{title}</h3>
      <p style={{ fontSize: 13, color: C.textMuted, maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.6 }}>{message}</p>
      <Link href={action.href} style={{ fontSize: 13, color: C.gold, textDecoration: "none", padding: "8px 16px", border: `1px solid ${C.goldMuted}`, borderRadius: 8 }}>
        {action.label} →
      </Link>
    </div>
  );
}
