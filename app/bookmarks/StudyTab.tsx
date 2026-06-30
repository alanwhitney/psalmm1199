"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, ChevronRight, ChevronsRight, Trash2, LogOut, Copy, Check, X, Pencil, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BIBLE_BOOKS, BOOK_BY_ID, nextChapterPosition } from "@/lib/books";
import { TRANSLATIONS, Translation } from "@/types";

function buildShareText(groupName: string, code: string): string {
  return `Join my Bible study "${groupName}" on Psalm 119:9. Code: ${code}`;
}

async function shareOrCopy(text: string, title: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text, title });
      return "shared";
    } catch {
      // user cancelled or share blocked — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

function friendlyJoinError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid invite")) return "That code doesn't match any group.";
  if (m.includes("owner")) return "You're the owner of this group.";
  if (m.includes("not authenticated")) return "Please sign in first.";
  return "Couldn't join the group. Try again.";
}

export type StudyGroup = {
  id: string;
  owner_id: string;
  name: string;
  book_id: string;
  book_name: string;
  chapter: number;
  translation: string;
  invite_code: string;
  created_at: string;
  member_count: number;
};

export default function StudyTab({ initialGroups, userId }: { initialGroups: StudyGroup[]; userId: string }) {
  const supabase = createClient();
  const [groups, setGroups] = useState(initialGroups);
  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [newGroup, setNewGroup] = useState<StudyGroup | null>(null); // shown after create

  async function joinByCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    setJoinLoading(true);
    try {
      const { data, error } = await supabase.rpc("join_study_group_by_code", { p_code: code });
      if (error) { setJoinError(friendlyJoinError(error.message)); return; }
      const group = data as Omit<StudyGroup, "member_count">;
      if (groups.some(g => g.id === group.id)) {
        setJoinError("You're already in this group.");
        return;
      }
      setGroups(prev => [...prev, { ...group, member_count: 1 }]);
      setJoinCode("");
    } finally {
      setJoinLoading(false);
    }
  }

  async function advanceGroup(id: string, bookId: string, chapter: number) {
    const next = nextChapterPosition(bookId, chapter);
    if (!next) return;
    await supabase.from("study_groups").update({ book_id: next.bookId, book_name: next.bookName, chapter: next.chapter }).eq("id", id);
    setGroups(prev => prev.map(g => g.id === id ? { ...g, book_id: next.bookId, book_name: next.bookName, chapter: next.chapter } : g));
  }

  async function leaveGroup(id: string) {
    await supabase.from("study_group_members").delete().eq("group_id", id).eq("user_id", userId);
    setGroups(prev => prev.filter(g => g.id !== id));
  }

  async function deleteGroup(id: string) {
    await supabase.from("study_groups").delete().eq("id", id);
    setGroups(prev => prev.filter(g => g.id !== id));
  }

  async function updateGroup(id: string, bookId: string, bookName: string, chapter: number, translation: string) {
    await supabase.from("study_groups").update({ book_id: bookId, book_name: bookName, chapter, translation }).eq("id", id);
    setGroups(prev => prev.map(g => g.id === id ? { ...g, book_id: bookId, book_name: bookName, chapter, translation } : g));
    setEditingGroup(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Join row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
            onKeyDown={e => e.key === "Enter" && joinByCode()}
            placeholder="Enter invite code…"
            maxLength={6}
            className="w-full px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-line font-mono tracking-wider uppercase"
          />
        </div>
        <button
          onClick={joinByCode}
          disabled={joinLoading || !joinCode.trim()}
          className="px-4 py-2 bg-gold text-surface text-sm font-semibold rounded-lg border-none cursor-pointer disabled:opacity-50"
        >
          {joinLoading ? "Joining…" : "Join"}
        </button>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-surface-overlay border border-line-subtle text-ink-secondary text-sm font-semibold rounded-lg cursor-pointer"
        >
          New
        </button>
      </div>
      {joinError && <p className="text-[12px] text-red-400 -mt-2">{joinError}</p>}

      {/* Group list */}
      {groups.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="flex justify-center mb-4"><Users size={28} className="text-ink-muted" /></div>
          <h3 className="text-base font-semibold text-ink-primary mb-2">No study groups yet</h3>
          <p className="text-[13px] text-ink-muted max-w-[320px] mx-auto leading-[1.6]">
            Create a group and share the invite code, or enter a code from someone else.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map(g => (
            <StudyGroupCard
              key={g.id}
              group={g}
              isOwner={g.owner_id === userId}
              onAdvance={() => advanceGroup(g.id, g.book_id, g.chapter)}
              onEdit={() => setEditingGroup(g)}
              onLeave={() => leaveGroup(g.id)}
              onDelete={() => deleteGroup(g.id)}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingGroup && (
        <EditModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSave={(bookId, bookName, chapter, translation) => updateGroup(editingGroup.id, bookId, bookName, chapter, translation)}
        />
      )}

      {/* Create modal */}
      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreate={group => { setGroups(prev => [{ ...group, member_count: 1 }, ...prev]); setCreating(false); setNewGroup(group); }}
        />
      )}

      {/* New group created — show invite code */}
      {newGroup && (
        <InviteCodeBanner group={newGroup} onDismiss={() => setNewGroup(null)} />
      )}
    </div>
  );
}

function StudyGroupCard({
  group, isOwner, onAdvance, onEdit, onLeave, onDelete,
}: {
  group: StudyGroup;
  isOwner: boolean;
  onAdvance: () => void;
  onEdit: () => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"shared" | "copied" | null>(null);
  const next = nextChapterPosition(group.book_id, group.chapter);

  function copyCode() {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    const result = await shareOrCopy(buildShareText(group.name, group.invite_code), group.name);
    setShareFeedback(result);
    setTimeout(() => setShareFeedback(null), 2000);
  }

  return (
    <div className="bg-surface-raised border border-line-subtle rounded-[10px] px-4 py-[14px] flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gold/[8%] border border-gold-muted flex items-center justify-center shrink-0">
            <Users size={14} className="text-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-primary mb-0.5 truncate">{group.name}</p>
            <p className="text-[11px] text-ink-muted m-0">
              {group.book_name} {group.chapter} · {group.translation}
              {group.member_count > 0 && <span className="ml-2">{group.member_count} {group.member_count === 1 ? "member" : "members"}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <button onClick={onEdit} title="Edit chapter"
              className="flex items-center gap-1 text-xs text-ink-secondary px-[10px] py-1.5 bg-surface-overlay rounded-md border border-line-subtle cursor-pointer">
              <Pencil size={12} /><span className="hidden sm:inline">Edit</span>
            </button>
          )}
          {isOwner && next && (
            <button onClick={onAdvance} title={`Advance to ${next.label}`}
              className="flex items-center gap-1 text-xs text-ink-secondary px-[10px] py-1.5 bg-surface-overlay rounded-md border border-line-subtle cursor-pointer">
              <ChevronsRight size={12} /><span className="hidden sm:inline">{next.label}</span>
            </button>
          )}
          <Link href={`/bible/${group.book_id}/${group.chapter}?t=${group.translation}`}
            className="flex items-center gap-1 text-xs text-ink-secondary no-underline px-[10px] py-1.5 bg-surface-overlay rounded-md border border-line-subtle">
            <span className="hidden sm:inline">Open </span><ChevronRight size={12} />
          </Link>
          {confirming ? (
            <div className="flex gap-1.5">
              <button onClick={isOwner ? onDelete : onLeave}
                className="text-[11px] px-[10px] py-[5px] bg-red-500/[8%] border border-red-500/25 rounded-md text-red-400 cursor-pointer">
                {isOwner ? "Delete" : "Leave"}
              </button>
              <button onClick={() => setConfirming(false)}
                className="text-[11px] px-[10px] py-[5px] bg-surface-overlay border border-line-subtle rounded-md text-ink-muted cursor-pointer">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1.5 flex">
              {isOwner ? <Trash2 size={14} /> : <LogOut size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Invite code row — owner only */}
      {isOwner && (
        <div className="flex items-center gap-2 pt-1 border-t border-line-subtle">
          <span className="text-[10px] text-ink-muted">Invite code</span>
          {showCode ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-mono font-bold text-gold tracking-widest">{group.invite_code}</span>
              <button onClick={copyCode} className="flex items-center gap-1 text-[10px] text-ink-muted bg-transparent border-none cursor-pointer p-0">
                {copied ? <Check size={11} className="text-gold" /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={share} className="flex items-center gap-1 text-[10px] text-ink-muted bg-transparent border-none cursor-pointer p-0">
                {shareFeedback ? <Check size={11} className="text-gold" /> : <Share2 size={11} />}
                {shareFeedback === "shared" ? "Shared" : shareFeedback === "copied" ? "Copied" : "Share"}
              </button>
              <button onClick={() => setShowCode(false)} className="text-ink-muted bg-transparent border-none cursor-pointer p-0 ml-1">
                <X size={11} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowCode(true)} className="text-[10px] text-gold bg-transparent border-none cursor-pointer p-0 font-semibold">
              Share →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InviteCodeBanner({ group, onDismiss }: { group: StudyGroup; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"shared" | "copied" | null>(null);
  function copy() {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  async function share() {
    const result = await shareOrCopy(buildShareText(group.name, group.invite_code), group.name);
    setShareFeedback(result);
    setTimeout(() => setShareFeedback(null), 2000);
  }
  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center z-50 px-4">
      <div className="bg-surface border border-line rounded-xl px-5 py-4 shadow-2xl max-w-sm w-full">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[13px] font-semibold text-ink-primary m-0">&ldquo;{group.name}&rdquo; created</p>
            <p className="text-[11px] text-ink-muted mt-0.5 m-0">Share this code with your group</p>
          </div>
          <button onClick={onDismiss} className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5 shrink-0"><X size={15} /></button>
        </div>
        <div className="bg-surface-overlay rounded-lg px-4 py-3 flex flex-col gap-2">
          <span className="text-2xl font-mono font-bold text-gold tracking-[0.25em] text-center">{group.invite_code}</span>
          <div className="flex gap-2">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] text-ink-secondary bg-surface border border-line-subtle rounded-md px-3 py-1.5 cursor-pointer">
              {copied ? <Check size={13} className="text-gold" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy code"}
            </button>
            <button onClick={share} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-surface bg-gold border-none rounded-md px-3 py-1.5 cursor-pointer">
              {shareFeedback ? <Check size={13} /> : <Share2 size={13} />}
              {shareFeedback === "shared" ? "Shared!" : shareFeedback === "copied" ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ group, onClose, onSave }: {
  group: StudyGroup;
  onClose: () => void;
  onSave: (bookId: string, bookName: string, chapter: number, translation: string) => void;
}) {
  const [bookId, setBookId] = useState(group.book_id);
  const [chapter, setChapter] = useState(group.chapter);
  const [translation, setTranslation] = useState<Translation>(group.translation as Translation);
  const [loading, setLoading] = useState(false);

  const book = BOOK_BY_ID[bookId];

  async function submit() {
    if (!book) return;
    setLoading(true);
    await onSave(book.id, book.name, chapter, translation);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line-subtle">
          <div>
            <h2 className="text-[15px] font-semibold text-ink-primary m-0">Edit Study Group</h2>
            <p className="text-[11px] text-ink-muted mt-0.5 m-0">{group.name}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Book</span>
              <select
                value={bookId}
                onChange={e => { setBookId(e.target.value); setChapter(1); }}
                className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary outline-none focus:border-line"
              >
                {BIBLE_BOOKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Chapter</span>
              <input
                type="number"
                min={1}
                max={book?.chapters ?? 1}
                value={chapter}
                onChange={e => setChapter(Math.max(1, Math.min(book?.chapters ?? 1, parseInt(e.target.value) || 1)))}
                className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary outline-none focus:border-line"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Translation</span>
            <select
              value={translation}
              onChange={e => setTranslation(e.target.value as Translation)}
              className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary outline-none focus:border-line"
            >
              {TRANSLATIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink-muted bg-surface-overlay border border-line-subtle rounded-lg cursor-pointer">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-surface bg-gold rounded-lg border-none cursor-pointer disabled:opacity-50">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (g: StudyGroup) => void }) {
  const [name, setName] = useState("");
  const [bookId, setBookId] = useState("MAT");
  const [chapter, setChapter] = useState(1);
  const [translation, setTranslation] = useState<Translation>("KJV");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const book = BOOK_BY_ID[bookId];

  async function submit() {
    if (!name.trim()) { setError("Please enter a name."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/study/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, book_id: bookId, chapter, translation }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong"); return; }
      onCreate({ ...json.group, member_count: 1 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line-subtle">
          <h2 className="text-[15px] font-semibold text-ink-primary m-0">New Study Group</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Name</span>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="e.g. Sunday Morning Group"
              className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-line"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Book</span>
              <select
                value={bookId}
                onChange={e => { setBookId(e.target.value); setChapter(1); }}
                className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary outline-none focus:border-line"
              >
                {BIBLE_BOOKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Chapter</span>
              <input
                type="number"
                min={1}
                max={book?.chapters ?? 1}
                value={chapter}
                onChange={e => setChapter(Math.max(1, Math.min(book?.chapters ?? 1, parseInt(e.target.value) || 1)))}
                className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary outline-none focus:border-line"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider">Translation</span>
            <select
              value={translation}
              onChange={e => setTranslation(e.target.value as Translation)}
              className="px-3 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary outline-none focus:border-line"
            >
              {TRANSLATIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {error && <p className="text-[12px] text-red-400 m-0">{error}</p>}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink-muted bg-surface-overlay border border-line-subtle rounded-lg cursor-pointer">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-surface bg-gold rounded-lg border-none cursor-pointer disabled:opacity-50">
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
