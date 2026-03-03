"use client";

import { computeAchievements, type AchievementInput } from "@/lib/achievements";

interface AchievementsPanelProps {
  input: AchievementInput;
}

export function AchievementsPanel({ input }: AchievementsPanelProps) {
  const achievements = computeAchievements(input);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <section className="bg-white dark:bg-surface-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-ink-900">Logros</h2>
        <span className="text-xs text-ink-600 bg-surface-100 rounded-full px-2 py-0.5">
          {unlocked}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`rounded-xl border p-3 flex flex-col gap-1 transition-all ${
              ach.unlocked
                ? "border-primary/40 bg-primary/5"
                : "border-surface-200 bg-surface-50 opacity-50 grayscale"
            }`}
          >
            <span className="text-2xl leading-none">{ach.emoji}</span>
            <p className="text-xs font-semibold text-ink-900 leading-tight">
              {ach.title}
            </p>
            <p className="text-xs text-ink-600 leading-snug">
              {ach.description}
            </p>
            {ach.unlocked && (
              <span className="mt-1 self-start text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5">
                Desbloqueado
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
