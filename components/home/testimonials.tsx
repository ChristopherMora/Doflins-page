"use client";

import { StarIcon } from "@heroicons/react/24/solid";

const TESTIMONIALS = [
  {
    name: "Sofía M.",
    initials: "SM",
    text: "La experiencia de revelar es adictiva. Cada pack se siente como abrir algo especial.",
    stars: 5,
    tag: "Coleccionista verificada",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Diego R.",
    initials: "DR",
    text: "La calidad me sorprendió. Mis hijos no paran de pedir más packs.",
    stars: 5,
    tag: "Compra recurrente",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Valentina L.",
    initials: "VL",
    text: "El sistema de rarezas le da otro nivel. Ya tengo 3 legendarias.",
    stars: 5,
    tag: "Fan de Animals",
    color: "bg-blue-100 text-blue-700",
  },
] as const;

export function Testimonials(): React.JSX.Element {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-title text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Lo que dicen los coleccionistas
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-500)]">
          +100 figuras reveladas por la comunidad
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--ink-300)]/40 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:bg-[var(--surface-50)]/60"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: t.stars }).map((_, i) => (
                <StarIcon key={i} className="h-4 w-4 text-amber-400" />
              ))}
            </div>
            <p className="flex-1 text-[15px] leading-relaxed text-[var(--ink-800)]">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${t.color}`}>
                {t.initials}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink-900)]">{t.name}</p>
                <p className="text-xs text-[var(--ink-500)]">{t.tag}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
