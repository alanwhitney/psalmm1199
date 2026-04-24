"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Circle, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { READING_PLANS, PLAN_BY_ID } from "@/lib/reading-plans";
import { createClient } from "@/lib/supabase/client";
import { BOOK_BY_ID } from "@/lib/books";

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

  const completedDays = planData
    ? Array.from(completions).filter(k => k.startsWith(`${activePlanId}:`)).length
    : 0;

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
      Array.from(next.values()).filter((k: string) => k.startsWith(`${planId}:`)).forEach((k: string) => next.delete(k));
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
      setCompletions(prev => { const n = new Set(prev); n.add(key); return n; });
    }
  }

  const enrolledPlanIds = new Set(userPlans.map(p => p.plan_id));

  return (
    <div>
      {/* Plan switcher + add button */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {userPlans.map(up => {
          const plan = PLAN_BY_ID[up.plan_id];
          if (!plan) return null;
          const isActive = activePlanId === up.plan_id;
          return (
            <button
              key={up.plan_id}
              onClick={() => setActivePlanId(up.plan_id)}
              className={`px-[14px] py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                isActive
                  ? "border border-gold bg-gold/[9%] text-gold"
                  : "border border-line-subtle bg-surface-raised text-ink-secondary"
              }`}
            >{plan.name}</button>
          );
        })}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 px-[14px] py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-line-subtle bg-surface-raised text-ink-muted"
        >
          <Plus size={13} /> Add plan
        </button>
      </div>

      {/* Plan picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-surface-raised border border-line-subtle rounded-2xl p-6 max-w-[480px] w-full">
            <h3 className="text-base font-semibold text-ink-primary mb-4">Choose a Reading Plan</h3>

            <div className="flex flex-col gap-2 mb-5">
              {READING_PLANS.map(plan => {
                const enrolled = enrolledPlanIds.has(plan.id);
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => !enrolled && setSelectedPlan(plan.id)}
                    className={`text-left px-[14px] py-3 rounded-[10px] border ${
                      isSelected ? "border-gold bg-gold/[7%]" : "border-line-subtle bg-surface-overlay"
                    } ${enrolled ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-ink-primary m-0">{plan.name}</p>
                      <span className="text-[11px] text-ink-muted">{plan.totalDays} days</span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 mb-0">{plan.description}</p>
                    {enrolled && <p className="text-[11px] text-gold mt-1 mb-0">Already enrolled</p>}
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="text-[11px] text-ink-secondary font-semibold uppercase tracking-[0.05em] block mb-1.5">Translation</label>
              <div className="flex gap-2">
                {["KJV", "NKJV", "NIV"].map(t => (
                  <button key={t} onClick={() => setSelectedTranslation(t)} className={`flex-1 py-[7px] text-xs font-bold rounded-md cursor-pointer ${
                    selectedTranslation === t
                      ? "bg-gold text-surface border-none"
                      : "bg-surface-overlay text-ink-secondary border border-line-subtle"
                  }`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowPicker(false); setSelectedPlan(null); }} className="flex-1 py-2.5 bg-surface-overlay border border-line-subtle rounded-lg text-ink-muted text-[13px] cursor-pointer">
                Cancel
              </button>
              <button
                onClick={startPlan}
                disabled={!selectedPlan}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold border-none ${
                  selectedPlan ? "bg-gold text-surface cursor-pointer" : "bg-surface-overlay text-ink-muted cursor-not-allowed"
                }`}
              >
                Start Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No plans enrolled */}
      {userPlans.length === 0 && (
        <div className="text-center py-[60px] px-6">
          <CalendarDays size={32} className="text-ink-muted mx-auto mb-4" />
          <h3 className="text-base font-semibold text-ink-primary mb-2">No reading plan yet</h3>
          <p className="text-[13px] text-ink-muted mx-auto mb-5 max-w-[300px] leading-[1.6]">
            Start a reading plan to work through the Bible systematically.
          </p>
          <button onClick={() => setShowPicker(true)} className="text-[13px] text-gold px-4 py-2 border border-gold-muted rounded-lg bg-transparent cursor-pointer">
            Choose a plan →
          </button>
        </div>
      )}

      {/* Active plan view */}
      {planData && activePlan && (
        <div>
          {/* Progress bar */}
          <div className="bg-surface-raised border border-line-subtle rounded-xl px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-[10px]">
              <div>
                <p className="text-sm font-semibold text-ink-primary mb-0.5">{planData.name}</p>
                <p className="text-xs text-ink-muted m-0">
                  Day {currentDay} of {planData.totalDays} · {completedDays} days completed
                </p>
              </div>
              <button onClick={() => removePlan(activePlanId!)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="h-1 bg-surface-overlay rounded-sm overflow-hidden">
              <div
                className="h-full bg-gold rounded-sm transition-[width] duration-300"
                style={{ width: `${Math.round((completedDays / planData.totalDays) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-ink-muted mt-1.5 mb-0 text-right">
              {Math.round((completedDays / planData.totalDays) * 100)}% complete
            </p>
          </div>

          {/* Today's reading */}
          {todayReading && (
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-semibold mb-[10px]">
                Day {currentDay} — Today&apos;s Reading
              </p>
              <div className="flex flex-col gap-1.5">
                {todayReading.readings.map((r, i) => {
                  const book = BOOK_BY_ID[r.bookId];
                  return (
                    <div key={i} className="flex items-center justify-between bg-surface-raised border border-line-subtle rounded-[10px] px-[14px] py-3">
                      <div className="flex items-center gap-[10px]">
                        <BookOpen size={14} className="text-gold" />
                        <span className="text-sm font-semibold text-ink-primary">{book?.name} {r.chapter}</span>
                      </div>
                      <Link href={`/bible/${r.bookId}/${r.chapter}?t=${activePlan.translation}`} className="flex items-center gap-1 text-xs text-ink-secondary no-underline px-[10px] py-[5px] bg-surface-overlay rounded-md border border-line-subtle">
                        Read <ChevronRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const isDayComplete = completions.has(`${activePlanId}:${currentDay}`);
                return (
                  <button
                    onClick={() => toggleDay(activePlanId!, currentDay)}
                    className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
                      isDayComplete
                        ? "border border-gold-muted bg-gold/[9%] text-gold"
                        : "border border-line-subtle bg-surface-raised text-ink-secondary"
                    }`}
                  >
                    {isDayComplete
                      ? <><CheckCircle size={15} /> Day {currentDay} complete</>
                      : <><Circle size={15} /> Mark day {currentDay} as complete</>}
                  </button>
                );
              })()}
            </div>
          )}

          {/* Recent days */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-semibold mb-[10px]">
              Recent Days
            </p>
            <div className="flex flex-col gap-1">
              {planData.readings.slice(Math.max(0, currentDay - 4), currentDay + 3).map(r => {
                const isComplete = completions.has(`${activePlanId}:${r.day}`);
                const isCurrent = r.day === currentDay;
                return (
                  <div
                    key={r.day}
                    className={`flex items-center gap-[10px] px-3 py-2 rounded-lg border ${
                      isCurrent ? "bg-gold/[3%] border-gold-muted" : "bg-transparent border-transparent"
                    }`}
                  >
                    <button onClick={() => toggleDay(activePlanId!, r.day)} className={`bg-transparent border-none cursor-pointer p-0 shrink-0 ${isComplete ? "text-gold" : "text-ink-muted"}`}>
                      {isComplete ? <CheckCircle size={15} /> : <Circle size={15} />}
                    </button>
                    <span className={`text-xs min-w-[48px] ${isCurrent ? "text-ink-primary font-semibold" : "text-ink-muted font-normal"}`}>
                      Day {r.day}
                    </span>
                    <span className="text-xs text-ink-secondary flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
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
