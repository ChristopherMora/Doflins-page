"use client";

import { StarIcon } from "@heroicons/react/24/solid";

const TESTIMONIALS = [
  {
    name: "Sofía M.",
    text: "Me encantó la experiencia de revelar. ¡La emoción de ver qué figurita te toca es adictiva!",
    stars: 5,
    tag: "Coleccionista verificada",
  },
  {
    name: "Diego R.",
    text: "La calidad de las figuras me sorprendió. Mis hijos no paran de pedir más packs.",
    stars: 5,
    tag: "Compra recurrente",
  },
  {
    name: "Valentina L.",
    text: "El sistema de rarezas le da un nivel extra. Ya tengo 3 legendarias y quiero las demás.",
    stars: 5,
    tag: "Fan #1 de Animals",
  },
] as const;

export function Testimonials(): React.JSX.Element {
  return (
    <section className="rounded-3xl border border-[#d4dab0] bg-gradient-to-br from-white/60 to-[#f5f8ea]/50 p-5 sm:p-6">
      <h2 className="mb-1 text-center font-title text-lg font-bold text-[var(--ink-900)] sm:text-xl">
        Lo que dicen nuestros coleccionistas
      </h2>
      <p className="mb-4 text-center text-xs text-[var(--ink-600)]">
        Más de 100 figuras reveladas por la comunidad
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-2 rounded-2xl border border-[#e2e8cd] bg-white/70 p-4 shadow-sm"
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: t.stars }).map((_, i) => (
                <StarIcon key={i} className="h-3.5 w-3.5 text-amber-400" />
              ))}
            </div>
            {/* Quote */}
            <p className="flex-1 text-sm leading-relaxed text-[var(--ink-800)]">
              &ldquo;{t.text}&rdquo;
            </p>
            {/* Author */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--ink-900)]">{t.name}</span>
              <span className="rounded-full bg-[#e7f5d6] px-2 py-0.5 text-[10px] font-semibold text-[#2f6020]">
                {t.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
