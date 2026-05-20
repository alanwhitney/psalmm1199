"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Check, Trash2, X, BookHeart, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Prayer } from "@/types";

interface Props {
  prayers: Prayer[];
  userId: string;
}

const inputClass = "w-full px-3 py-2.5 bg-surface-overlay border border-line-subtle rounded-lg text-[13px] text-ink-primary placeholder:text-ink-muted outline-none focus:border-line box-border resize-none";

export default function JournalClient({ prayers: initial, userId }: Props) {
  const supabase = createClient();

  const [prayers, setPrayers] = useState<Prayer[]>(initial);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [composeSaving, setComposeSaving] = useState(false);
  const [composeSaved, setComposeSaved] = useState(false);
  const draftIdRef = useRef<string | null>(null);
  const draftPrayerRef = useRef<Prayer | null>(null);
  const composeTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingCompose = useRef<{ title: string; content: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editSavedId, setEditSavedId] = useState<string | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingEdit = useRef<{ prayer: Prayer; title: string; content: string } | null>(null);
  const FILTERS = ["all", "active", "answered"] as const;
  const hashFilter = (typeof window !== "undefined" ? window.location.hash.slice(1) : "") as typeof FILTERS[number];
  const [filter, setFilter] = useState<"all" | "active" | "answered">(
    FILTERS.includes(hashFilter) ? hashFilter : "active"
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    history.replaceState(null, "", `#${filter}`);
  }, [filter]);

  function handleComposeChange(newTitle: string, newContent: string) {
    setTitle(newTitle);
    setContent(newContent);
    if (!newContent.trim()) return;
    pendingCompose.current = { title: newTitle, content: newContent };
    if (composeTimer.current) clearTimeout(composeTimer.current);
    composeTimer.current = setTimeout(() => autoSaveCompose(), 1000);
  }

  async function autoSaveCompose() {
    const pending = pendingCompose.current;
    pendingCompose.current = null;
    if (!pending || !pending.content.trim()) return;
    setComposeSaving(true);
    if (!draftIdRef.current) {
      const { data } = await supabase
        .from("prayers")
        .insert({ user_id: userId, title: pending.title.trim() || null, content: pending.content.trim() })
        .select().single();
      if (data) { draftIdRef.current = data.id; draftPrayerRef.current = data; }
    } else {
      await supabase.from("prayers")
        .update({ title: pending.title.trim() || null, content: pending.content.trim() })
        .eq("id", draftIdRef.current);
    }
    setComposeSaving(false);
    setComposeSaved(true);
    setTimeout(() => setComposeSaved(false), 2000);
  }

  function finishCompose() {
    if (composeTimer.current) clearTimeout(composeTimer.current);
    const pending = pendingCompose.current;
    pendingCompose.current = null;
    const titleVal = title.trim() || null;
    const contentVal = content.trim();
    const currentDraftId = draftIdRef.current;
    const draftData = draftPrayerRef.current;
    draftIdRef.current = null;
    draftPrayerRef.current = null;
    setTitle(""); setContent(""); setComposing(false);
    if (currentDraftId && draftData) {
      if (pending) supabase.from("prayers").update({ title: titleVal, content: contentVal }).eq("id", currentDraftId);
      setPrayers(prev => [{ ...draftData, title: titleVal ?? undefined, content: contentVal, updated_at: new Date().toISOString() }, ...prev]);
    } else if (contentVal) {
      supabase.from("prayers")
        .insert({ user_id: userId, title: titleVal, content: contentVal })
        .select().single()
        .then(({ data }) => { if (data) setPrayers(prev => [data, ...prev]); });
    }
  }

  function cancelCompose() {
    if (composeTimer.current) clearTimeout(composeTimer.current);
    pendingCompose.current = null;
    const currentDraftId = draftIdRef.current;
    draftIdRef.current = null;
    draftPrayerRef.current = null;
    if (currentDraftId) supabase.from("prayers").delete().eq("id", currentDraftId);
    setTitle(""); setContent(""); setComposing(false);
  }

  async function toggleAnswered(prayer: Prayer) {
    const answered = !prayer.answered;
    const answered_at = answered ? new Date().toISOString() : null;
    const { error } = await supabase.from("prayers").update({ answered, answered_at }).eq("id", prayer.id);
    if (!error) setPrayers(prayers.map(p => p.id === prayer.id ? { ...p, answered, answered_at: answered_at ?? undefined } : p));
  }

  async function deletePrayer(id: string) {
    const { error } = await supabase.from("prayers").delete().eq("id", id);
    if (error) { setConfirmDeleteId(null); return; }
    setPrayers(prayers.filter(p => p.id !== id));
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
  }

  function startEdit(prayer: Prayer) {
    setEditingId(prayer.id);
    setEditTitle(prayer.title ?? "");
    setEditContent(prayer.content);
    setExpandedId(prayer.id);
  }

  async function saveEdit(prayer: Prayer, title: string, content: string) {
    if (!content.trim()) return;
    setEditSaving(true);
    const updates = { title: title.trim() || null, content: content.trim() };
    const { error } = await supabase.from("prayers").update(updates).eq("id", prayer.id);
    setEditSaving(false);
    if (!error) {
      setPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, ...updates, title: updates.title ?? undefined } : p));
      setEditSavedId(prayer.id);
      setTimeout(() => setEditSavedId(null), 2000);
    }
  }

  function handleEditChange(prayer: Prayer, newTitle: string, newContent: string) {
    setEditTitle(newTitle);
    setEditContent(newContent);
    pendingEdit.current = { prayer, title: newTitle, content: newContent };
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (pendingEdit.current) {
        const { prayer, title, content } = pendingEdit.current;
        saveEdit(prayer, title, content);
      }
    }, 1000);
  }

  function flushEdit() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (pendingEdit.current) {
      const { prayer, title, content } = pendingEdit.current;
      pendingEdit.current = null;
      saveEdit(prayer, title, content);
    }
  }

  const q = search.toLowerCase();
  const filtered = prayers.filter(p => {
    const matchesFilter = filter === "all" ? true : filter === "answered" ? p.answered : !p.answered;
    const matchesSearch = !q || p.content.toLowerCase().includes(q) || (p.title ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const answeredCount = prayers.filter(p => p.answered).length;

  return (
    <div className="max-w-[680px] mx-auto py-8 px-4">
        {/* Stats row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-ink-primary mb-0.5">Prayer Journal</h1>
            <p className="text-xs text-ink-muted m-0">
              {prayers.length} {prayers.length === 1 ? "prayer" : "prayers"} · {answeredCount} answered
            </p>
          </div>
          <button
            onClick={() => { setComposing(true); setExpandedId(null); setEditingId(null); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gold text-surface font-bold text-[13px] rounded-lg border-none cursor-pointer"
          >
            <Plus size={14} /> New prayer
          </button>
        </div>

        {/* Compose form */}
        {composing && (
          <div className="bg-surface-raised border border-line-subtle rounded-xl p-5 mb-6">
            <input
              type="text"
              value={title}
              onChange={e => handleComposeChange(e.target.value, content)}
              placeholder="Title (optional)"
              className={inputClass + " mb-3"}
            />
            <textarea
              value={content}
              onChange={e => handleComposeChange(title, e.target.value)}
              placeholder="Write your prayer…"
              rows={5}
              className={inputClass + " mb-4"}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[11px] text-ink-muted mr-auto">
                {composeSaving ? "Saving…" : composeSaved ? "Saved" : ""}
              </span>
              <button
                onClick={cancelCompose}
                className="px-4 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-[13px] text-ink-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={finishCompose}
                disabled={composeSaving || !content.trim()}
                className={`px-4 py-2 bg-gold text-surface font-bold text-[13px] rounded-lg border-none cursor-pointer ${composeSaving || !content.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        {prayers.length > 0 && (
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prayers…"
              className="w-full pl-9 pr-8 py-2 bg-surface-overlay border border-line-subtle rounded-lg text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-line"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted bg-transparent border-none cursor-pointer p-0.5">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Filter tabs */}
        {prayers.length > 0 && (
          <div className="flex gap-1 mb-4 border-b border-b-line-subtle">
            {(["all", "active", "answered"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`bg-transparent border-none cursor-pointer px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px capitalize ${
                  filter === f ? "text-gold border-b-gold" : "text-ink-muted border-b-transparent"
                }`}
              >
                {f === "all" ? `All (${prayers.length})` : f === "answered" ? `Answered (${answeredCount})` : `Active (${prayers.length - answeredCount})`}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {prayers.length === 0 && !composing && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gold/[8%] border border-gold-muted flex items-center justify-center mx-auto mb-4">
              <BookHeart size={24} className="text-gold" />
            </div>
            <h2 className="text-[17px] font-semibold text-ink-primary mb-2">No prayers yet</h2>
            <p className="text-sm text-ink-muted mb-6 max-w-[300px] mx-auto leading-[1.6]">
              Use this journal to bring your requests to God and remember how He answers.
            </p>
            <button
              onClick={() => setComposing(true)}
              className="px-5 py-2.5 bg-gold text-surface font-bold text-[13px] rounded-lg border-none cursor-pointer"
            >
              Write your first prayer
            </button>
          </div>
        )}

        {/* Prayer list */}
        <div className="flex flex-col gap-3">
          {filtered.map(prayer => {
            const isExpanded = expandedId === prayer.id;
            const isEditing = editingId === prayer.id;
            const isConfirmingDelete = confirmDeleteId === prayer.id;

            return (
              <div
                key={prayer.id}
                className={`bg-surface-raised border rounded-xl px-5 py-4 transition-colors ${
                  prayer.answered ? "border-gold/30 bg-gold/[3%]" : "border-line-subtle"
                }`}
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  {/* Answered toggle */}
                  <button
                    onClick={() => toggleAnswered(prayer)}
                    title={prayer.answered ? "Mark as unanswered" : "Mark as answered"}
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-transparent cursor-pointer transition-colors ${
                      prayer.answered ? "border-gold bg-gold/20 text-gold" : "border-line text-transparent"
                    }`}
                  >
                    <Check size={11} strokeWidth={3} />
                  </button>

                  {/* Title / content preview */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : prayer.id)}
                    className="flex-1 text-left bg-transparent border-none cursor-pointer p-0"
                  >
                    {prayer.title ? (
                      <>
                        <p className={`text-[13px] font-semibold m-0 mb-0.5 ${prayer.answered ? "text-ink-muted line-through" : "text-ink-primary"}`}>
                          {prayer.title}
                        </p>
                        <p className="text-xs text-ink-muted m-0 line-clamp-2 leading-[1.5]">
                          {prayer.content}
                        </p>
                      </>
                    ) : (
                      <p className={`text-[13px] m-0 leading-[1.5] ${prayer.answered ? "text-ink-muted line-through" : "text-ink-primary"} ${!isExpanded ? "line-clamp-2" : ""}`}>
                        {prayer.content}
                      </p>
                    )}
                    <p className="text-[11px] text-ink-muted m-0 mt-1">
                      {new Date(prayer.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {prayer.answered && prayer.answered_at && (
                        <span className="text-gold ml-2">· Answered {new Date(prayer.answered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                    </p>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : prayer.id)}
                    className="shrink-0 bg-transparent border-none cursor-pointer text-ink-muted p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Delete confirmation */}
                {isConfirmingDelete && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-t-line-subtle">
                    <span className="text-xs text-ink-muted flex-1">Remove this prayer?</span>
                    <button onClick={() => deletePrayer(prayer.id)} className="text-[11px] px-3 py-1.5 bg-red-500/[8%] border border-red-500/25 rounded-md text-red-400 cursor-pointer">Remove</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] px-3 py-1.5 bg-surface-overlay border border-line-subtle rounded-md text-ink-muted cursor-pointer">Cancel</button>
                  </div>
                )}

                {/* Expanded: full text + edit */}
                {isExpanded && !isEditing && (
                  <div className="mt-3 pt-3 border-t border-t-line-subtle">
                    {prayer.title && (
                      <p className="text-[13px] text-ink-primary leading-[1.7] mb-2 whitespace-pre-wrap">{prayer.content}</p>
                    )}
                    <button
                      onClick={() => startEdit(prayer)}
                      className="text-[11px] text-gold bg-transparent border-none cursor-pointer p-0"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-t-line-subtle">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => handleEditChange(prayer, e.target.value, editContent)}
                      placeholder="Title (optional)"
                      className={inputClass + " mb-3"}
                    />
                    <textarea
                      value={editContent}
                      onChange={e => handleEditChange(prayer, editTitle, e.target.value)}
                      rows={5}
                      className={inputClass + " mb-3"}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[11px] text-ink-muted mr-auto">
                        {editSaving && editingId === prayer.id ? "Saving…" : editSavedId === prayer.id ? "Saved" : ""}
                      </span>
                      <button
                        onClick={() => { flushEdit(); setEditingId(null); }}
                        className="px-3 py-1.5 bg-gold text-surface font-bold text-[13px] rounded-lg border-none cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && prayers.length > 0 && (
          <p className="text-center text-sm text-ink-muted py-10">No {filter} prayers.</p>
        )}
    </div>
  );
}
