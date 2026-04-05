"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";

interface Figure {
  id: number;
  nombre: string;
  serie: string;
  rareza: string;
  imagenUrl: string;
  slug: string;
}

interface RecentResponse {
  figures: Figure[];
}

const RARITY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  MYTHIC: { label: "Mítico", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  ULTRA: { label: "Ultra", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  LEGENDARY: { label: "Legendario", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  EPIC: { label: "Épico", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  RARE: { label: "Raro", color: "#2563eb", bg: "rgba(37,99,235,0.12)" },
  COMMON: { label: "Común", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
};

export function FeaturedCollection(): React.JSX.Element {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doflins/recent")
      .then((r) => (r.ok ? r.json() as Promise<RecentResponse> : null))
      .then((data) => { if (data) setFigures(data.figures.slice(0, 8)); })
      .catch(() => setFigures([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-[var(--surface-200)] bg-[var(--surface-50)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-500)]">
            <SparklesIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Catálogo directo
          </div>
          <div>
            <h2 className="font-title text-2xl font-bold text-[var(--ink-900)] sm:text-3xl">
              Mira algunas figuras del catálogo
            </h2>
            <p className="max-w-2xl text-sm text-[var(--ink-600)] sm:text-base">
              Las figuras más recientes en tu catálogo, listas para descubrir. Este bloque ayuda a que la página muestre producto real desde el primer scroll.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" size="md" className="w-full sm:w-auto">
          <Link href="/reveal?universe=animals">Ver catálogo completo</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[2rem] bg-[var(--surface-100)] p-4" />
          ))
        ) : (
          figures.map((fig) => {
            const rarity = RARITY_STYLES[fig.rareza] ?? RARITY_STYLES.COMMON;
            return (
              <Link
                key={fig.id}
                href={`/carta/${fig.id}`}
                className="group overflow-hidden rounded-[2rem] border border-[var(--surface-200)] bg-[var(--surface-50)] ring-1 ring-transparent shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-[var(--surface-200)]"
              >
                <div className="relative h-56 overflow-hidden bg-[var(--surface-100)]">
                  <Image
                    src={fig.imagenUrl}
                    alt={fig.nombre}
                    fill
                    sizes="(min-width: 1280px) 280px, (min-width: 768px) 320px, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 rounded-full bg-white/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-700)] shadow-sm backdrop-blur-sm">
                    <span>Imagen oficial</span>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: rarity.bg, color: rarity.color }}>
                      {rarity.label}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                      {fig.serie}
                    </p>
                    <h3 className="mt-2 text-base font-bold text-[var(--ink-900)]">
                      {fig.nombre}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-[var(--ink-600)]">
                    <span className="rounded-full border border-[var(--surface-200)] bg-[var(--surface-100)] px-2.5 py-1 font-semibold uppercase tracking-[0.18em] text-[var(--ink-700)]">
                      Pendiente de guardar
                    </span>
                    <span className="text-xs text-[var(--ink-500)]">#{fig.id}</span>
                  </div>

                  <div className="pt-2">
                    <Button asChild variant="ghost" size="sm" className="h-9 rounded-full px-4 text-[var(--ink-900)]">
                      <Link href={`/carta/${fig.id}`}>Ver ficha</Link>
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
