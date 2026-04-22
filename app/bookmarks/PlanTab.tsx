"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Circle, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { READING_PLANS, PLAN_BY_ID } from "@/lib/reading-plans";
import { createClient } from "@/lib/supabase/client";
import { BOOK_BY_ID } from "@/lib/books";

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

interface UserPlan {
  id: string;
  plan_id: string;
  started_at: string;
  translation: string;
  active: boolean;
}

interface Props {
  userId: string;
  initialPlans: UserPlan[];
  initialCompletions: { plan_id: string; day: number }[];
  defaultTranslation?: string;
}

export default function PlanTab({ userId, initialPlans, initialCompletions, defaultTranslation = "KJV" }: Props) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [userPlans, setUserPlans] = useState<UserPlan[]>(initialPlans);
  const [completions, setCompletions] = useState<Set<string>>(
    new Set(initialCompletions.map(c => `${c.plan_id}:${c.day}`))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState(defaultTranslation);
  const [activePlanId, setActivePlanId] = useState<string | null>(
    userPlans.find(p => p.active)?.plan_id ?? null
  );

  const activePlan = userPlans.find(p => p.plan_id === activePlanId);
  const planData = activePlanId ? PLAN_BY_ID[activePlanId] : null;

  // How many days completed for active plan
  const completedDays = planData
    ? Array.from(completions).filter(k => k.startsWith(`${activePlanId}:`)).length
    : 0;

  // Current day = next uncompleted day
  const currentDay = planData
    ? (planData.readings.find(r => !completions.has(`${activePlanId}:${r.day}`))?.day ?? planData.totalDays)
    : 1;

  const todayReading = planData?.readings.find(r => r.day === currentDay);

  async function startPlan() {
    if (!selectedPlan) return;
    const existing = userPlans.find(p => p.plan_id === selectedPlan);
    if (existing) {
      setActivePlanId(selectedPlan);
      setShowPicker(false);
      return;
    }

    const { data } = await supabase.from("user_reading_plans").insert({
      user_id: userId,
      plan_id: selectedPlan,
      translation: selectedTranslation,
      active: true,
    }).select().single();

    if (data) {
      setUserPlans(prev => [...prev, data]);
      setActivePlanId(selectedPlan);
    }
    setShowPicker(false);
  }

  async function removePlan(planId: string) {
    await supabase.from("user_reading_plans").delete().eq("user_id", userId).eq("plan_id", planId);
    await supabase.from("plan_completions").delete().eq("user_id", userId).eq("plan_id", planId);
    setUserPlans(prev => prev.filter(p => p.plan_id !== planId));
    setCompletions(prev => {
      const next = new Set(prev);
      Array.from(next).filter(k => k.startsWith(`${planId}:`)).forEach(k => next.delete(k));
      return next;
    });
    if (activePlanId === planId) setActivePlanId(userPlans.find(p => p.plan_id !== planId)?.plan_id ?? null);
  }

  async function toggleDay(planId: string, day: number) {
    const key = `${planId}:${day}`;
    const isCompleted = completions.has(key);

    if (isCompleted) {
      await supabase.from("plan_completions").delete()
        .eq("user_id", userId).eq("plan_id", planId).eq("day", day);
      setCompletions(prev => { const n = new Set(prev); n.delete(key); return n; });
    } else {
      await supabase.from("plan_completions").insert({ user_id: userId, plan_id: planId, day });
      setCompletions(prev => new Set([...prev, key]));
    }
  }

  const enrolledPlanIds = new Set(userPlans.map(p => p.plan_id));

  return (
    <div>
      {/* Plan switcher + add button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {userPlans.map(up => {
          const plan = PLAN_BY_ID[up.plan_id];
          if (!plan) return null;
          return (
            <button
              key={up.plan_id}
              onClick={() => setActivePlanId(up.plan_id)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${activePlanId === up.plan_id ? C.gold : C.border}`,
                background: activePlanId === up.plan_id ? `${C.gold}18` : C.bgRaised,
                color: activePlanId === up.plan_id ? C.gold : C.textSecondary,
              }}
            >{plan.name}</button>
          );
        })}
        <button
          onClick={() => setShowPicker(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.border}`, background: C.bgRaised, color: C.textMuted }}
        >
          <Plus size={13} /> Add plan
        </button>
      </div>

      {/* Plan picker modal */}
      {showPicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, maxWidth: 480, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: "0 0 16px" }}>Choose a Reading Plan</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {READING_PLANS.map(plan => {
                const enrolled = enrolledPlanIds.has(plan.id);
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => !enrolled && setSelectedPlan(plan.id)}
                    style={{
                      textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: enrolled ? "default" : "pointer",
                      border: `1px solid ${isSelected ? C.gold : C.border}`,
                      background: isSelected ? `${C.gold}12` : C.bgOverlay,
                      opacity: enrolled ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{plan.name}</p>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{plan.totalDays} days</span>
                    </div>
                    <p style={{ fontSize: 12, color: C.textSecondary, margin: "4px 0 0" }}>{plan.description}</p>
                    {enrolled && <p style={{ fontSize: 11, color: C.gold, margin: "4px 0 0" }}>Already enrolled</p>}
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Translation</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["KJV", "NKJV", "NIV"].map(t => (
                  <button key={t} onClick={() => setSelectedTranslation(t)} style={{
                    flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                    border: selectedTranslation !== t ? `1px solid ${C.border}` : "none",
                    background: selectedTranslation === t ? C.gold : C.bgOverlay,
                    color: selectedTranslation === t ? C.bg : C.textSecondary,
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowPicker(false); setSelectedPlan(null); }} style={{ flex: 1, padding: "10px 0", background: C.bgOverlay, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={startPlan}
                disabled={!selectedPlan}
                style={{ flex: 1, padding: "10px 0", background: selectedPlan ? C.gold : C.bgOverlay, border: "none", borderRadius: 8, color: selectedPlan ? C.bg : C.textMuted, fontSize: 13, fontWeight: 700, cursor: selectedPlan ? "pointer" : "not-allowed" }}
              >
                Start Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No plans enrolled */}
      {userPlans.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <CalendarDays size={32} color={C.textMuted} style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>No reading plan yet</h3>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 auto 20px", maxWidth: 300, lineHeight: 1.6 }}>
            Start a reading plan to work through the Bible systematically.
          </p>
          <button onClick={() => setShowPicker(true)} style={{ fontSize: 13, color: C.gold, padding: "8px 16px", border: `1px solid ${C.goldMuted}`, borderRadius: 8, background: "none", cursor: "pointer" }}>
            Choose a plan →
          </button>
        </div>
      )}

      {/* Active plan view */}
      {planData && activePlan && (
        <div>
          {/* Progress bar */}
          <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: "0 0 2px" }}>{planData.name}</p>
                <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
                  Day {currentDay} of {planData.totalDays} · {completedDays} days completed
                </p>
              </div>
              <button onClick={() => removePlan(activePlanId!)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: C.bgOverlay, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.gold, borderRadius: 2, width: `${Math.round((completedDays / planData.totalDays) * 100)}%`, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 11, color: C.textMuted, margin: "6px 0 0", textAlign: "right" }}>
              {Math.round((completedDays / planData.totalDays) * 100)}% complete
            </p>
          </div>

          {/* Today's reading */}
          {todayReading && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, fontWeight: 600, marginBottom: 10 }}>
                Day {currentDay} — Today's Reading
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {todayReading.readings.map((r, i) => {
                  const book = BOOK_BY_ID[r.bookId];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <BookOpen size={14} color={C.gold} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{book?.name} {r.chapter}</span>
                      </div>
                      <Link href={`/bible/${r.bookId}/${r.chapter}?t=${activePlan.translation}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSecondary, textDecoration: "none", padding: "5px 10px", background: C.bgOverlay, borderRadius: 6, border: `1px solid ${C.border}` }}>
                        Read <ChevronRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => toggleDay(activePlanId!, currentDay)}
                style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${completions.has(`${activePlanId}:${currentDay}`) ? C.goldMuted : C.border}`, background: completions.has(`${activePlanId}:${currentDay}`) ? `${C.gold}18` : C.bgRaised, color: completions.has(`${activePlanId}:${currentDay}`) ? C.gold : C.textSecondary }}
              >
                {completions.has(`${activePlanId}:${currentDay}`)
                  ? <><CheckCircle size={15} /> Day {currentDay} complete</>
                  : <><Circle size={15} /> Mark day {currentDay} as complete</>}
              </button>
            </div>
          )}

          {/* Recent days */}
          <div>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, fontWeight: 600, marginBottom: 10 }}>
              Recent Days
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {planData.readings.slice(Math.max(0, currentDay - 4), currentDay + 3).map(r => {
                const isComplete = completions.has(`${activePlanId}:${r.day}`);
                const isCurrent = r.day === currentDay;
                return (
                  <div
                    key={r.day}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: isCurrent ? `${C.gold}08` : "transparent", border: `1px solid ${isCurrent ? C.goldMuted : "transparent"}` }}
                  >
                    <button onClick={() => toggleDay(activePlanId!, r.day)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: isComplete ? C.gold : C.textMuted, flexShrink: 0 }}>
                      {isComplete ? <CheckCircle size={15} /> : <Circle size={15} />}
                    </button>
                    <span style={{ fontSize: 12, color: isCurrent ? C.textPrimary : C.textMuted, fontWeight: isCurrent ? 600 : 400, minWidth: 48 }}>
                      Day {r.day}
                    </span>
                    <span style={{ fontSize: 12, color: C.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.readings.map(rd => `${BOOK_BY_ID[rd.bookId]?.name} ${rd.chapter}`).join(", ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
