"use client";

import { ShoppingCartIcon, SparklesIcon, TrophyIcon } from "@heroicons/react/24/solid";

const STEPS = [
  {
    icon: ShoppingCartIcon,
    title: "Elige tu pack",
    desc: "Selecciona el pack que más te guste.",
    accent: "#4f7f2d",
    bg: "#e7f5d6",
  },
  {
    icon: SparklesIcon,
    title: "Revela tus figuras",
    desc: "Descubre qué personajes te tocaron.",
    accent: "#c47c20",
    bg: "#fff0c8",
  },
  {
    icon: TrophyIcon,
    title: "Completa tu colección",
    desc: "Colecciona rarezas y sube en el ranking.",
    accent: "#4360d2",
    bg: "#e3ebff",
  },
] as const;

export function HowItWorks(): React.JSX.Element {
  return (
    <section className="space-y-6">
      <h2 className="text-center font-title text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
        ¿Cómo funciona?
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center gap-3 text-center">
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm"
              style={{ background: step.bg }}
            >
              <step.icon className="h-7 w-7" style={{ color: step.accent }} />
              <span
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: step.accent }}
              >
                {i + 1}
              </span>
            </div>
            <h3 className="font-title text-base font-bold text-[var(--ink-900)]">{step.title}</h3>
            <p className="text-sm text-[var(--ink-600)]">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
