"use client";

import { ShoppingCartIcon, SparklesIcon, TrophyIcon } from "@heroicons/react/24/solid";

const STEPS = [
  {
    icon: ShoppingCartIcon,
    title: "Compra tu pack",
    desc: "Elige entre diferentes packs con distintas cantidades de figuras.",
    accent: "#4f7f2d",
    bg: "#e7f5d6",
  },
  {
    icon: SparklesIcon,
    title: "Revela tus figuras",
    desc: "Descubre qué personajes te tocaron con nuestra experiencia interactiva.",
    accent: "#c47c20",
    bg: "#fff0c8",
  },
  {
    icon: TrophyIcon,
    title: "Completa tu colección",
    desc: "Colecciona rarezas, sube en el ranking y presume tu colección.",
    accent: "#4360d2",
    bg: "#e3ebff",
  },
] as const;

export function HowItWorks(): React.JSX.Element {
  return (
    <section className="rounded-3xl border border-[#d4dab0] bg-gradient-to-br from-white/70 to-[#f5f8ea]/60 p-5 sm:p-6">
      <h2 className="mb-4 text-center font-title text-lg font-bold text-[var(--ink-900)] sm:text-xl">
        ¿Cómo funciona?
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center gap-2 text-center">
            {/* Numbered circle with icon */}
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
              style={{ background: step.bg }}
            >
              <step.icon className="h-6 w-6" style={{ color: step.accent }} />
              <span
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: step.accent }}
              >
                {i + 1}
              </span>
            </div>
            <h3 className="font-title text-sm font-bold text-[var(--ink-900)]">{step.title}</h3>
            <p className="text-xs leading-relaxed text-[var(--ink-700)]">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
