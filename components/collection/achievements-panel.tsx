"use client";

import { computeAchievements, type AchievementInput } from "@/lib/achievements";

interface AchievementsPanelProps {
  input: AchievementInput;
}

// Map of achievement IDs → a function returning { current, target } for locked progress
const PROGRESS_MAP: Record<string, (input: AchievementInput) => { current: number; target: number } | null> = {
  five_figures:       (i) => ({ current: Math.min(i.totalOwned, 5),  target: 5 }),
  ten_figures:        (i) => ({ current: Math.min(i.totalOwned, 10), target: 10 }),
  twenty_figures:     (i) => ({ current: Math.min(i.totalOwned, 20), target: 20 }),
  fifty_figures:      (i) => ({ current: Math.min(i.totalOwned, 50), target: 50 }),
  half_collection:    (i) => i.totalDoflins > 0 ? { current: i.totalOwned, target: Math.ceil(i.totalDoflins / 2) } : null,
  complete_collection:(i) => i.totalDoflins > 0 ? { current: i.totalOwned, target: i.totalDoflins } : null,
  all_common:         (i) => (i.totalByRarity["common"] ?? 0) > 0 ? { current: i.ownedByRarity["common"] ?? 0, target: i.totalByRarity["common"] ?? 1 } : null,
  all_rare:           (i) => (i.totalByRarity["rare"] ?? 0) > 0 ? { current: i.ownedByRarity["rare"] ?? 0, target: i.totalByRarity["rare"] ?? 1 } : null,
};

export function AchievementsPanel({ input }: AchievementsPanelProps) {
  const achievements = computeAchievements(input);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <section className="rounded-2xl shadow-sm p-5" style={{ background: "var(--surface-100)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--ink-900)" }}>Logros</h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full overflow-hidden" style={{ background: "var(--surface-200)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${achievements.length > 0 ? Math.round((unlocked / achievements.length) * 100) : 0}%`,
                background: "var(--brand-primary)",
              }}
            />
          </div>
          <span
            className="text-xs rounded-full px-2 py-0.5"
            style={{ color: "var(--ink-600)", background: "var(--surface-200)" }}
          >
            {unlocked}/{achievements.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map((ach) => {
          const progressFn = !ach.unlocked ? PROGRESS_MAP[ach.id] : null;
          const progress = progressFn ? progressFn(input) : null;
          const progressPct = progress ? Math.round((progress.current / progress.target) * 100) : 0;

          return (
            <div
              key={ach.id}
              className="rounded-xl border p-3 flex flex-col gap-1.5 transition-all"
              style={
                ach.unlocked
                  ? {
                      borderColor: "color-mix(in srgb, var(--brand-primary) 40%, transparent)",
                      background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
                    }
                  : {
                      borderColor: "var(--surface-200)",
                      background: "var(--surface-100)",
                      opacity: progress ? 0.85 : 0.55,
                    }
              }
            >
              <span className={`text-2xl leading-none ${ach.unlocked ? "" : "grayscale"}`}>{ach.emoji}</span>
              <p className="text-xs font-semibold leading-tight" style={{ color: "var(--ink-900)" }}>
                {ach.title}
              </p>
              <p className="text-xs leading-snug" style={{ color: "var(--ink-700)" }}>
                {ach.description}
              </p>

              {/* Progress bar for locked achievements with a trackable metric */}
              {!ach.unlocked && progress && (
                <div className="mt-0.5 space-y-0.5">
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-200)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progressPct}%`,
                        background: "color-mix(in srgb, var(--brand-primary) 65%, transparent)",
                      }}
                    />
                  </div>
                  <p className="text-right text-[10px]" style={{ color: "var(--ink-500)" }}>
                    {progress.current}/{progress.target}
                  </p>
                </div>
              )}

              {ach.unlocked && (
                <span
                  className="mt-0.5 self-start text-xs font-bold uppercase tracking-wide rounded px-1.5 py-0.5"
                  style={{
                    color: "var(--brand-primary)",
                    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                  }}
                >
                  ✓ Desbloqueado
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
