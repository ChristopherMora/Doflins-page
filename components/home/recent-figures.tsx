"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";

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

const RARITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  MYTHIC:    { label: "Mítico",    color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  ULTRA:     { label: "Ultra",     color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  LEGENDARY: { label: "Legendario",color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  EPIC:      { label: "Épico",     color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  RARE:      { label: "Raro",      color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  COMMON:    { label: "Común",     color: "#16a34a", bg: "rgba(22,163,74,0.15)"  },
};

const SERIE_LABEL: Record<string, string> = {
  Animals: "🐆 Animals",
  MegaAnimals: "⚡ Mega",
  Multiverse: "🌌 Multiverse",
};

function SkeletonCard(): React.JSX.Element {
  return (
    <div className="flex-none w-[148px] rounded-2xl overflow-hidden bg-[var(--surface-100)] animate-pulse">
      <div className="h-[148px] bg-[var(--surface-200)]" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-[var(--surface-200)]" />
        <div className="h-3 w-1/2 rounded bg-[var(--surface-200)]" />
      </div>
    </div>
  );
}

export function RecentFigures({ title, viewAllHref }: { title?: string; viewAllHref?: string }): React.JSX.Element {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/doflins/recent")
      .then((r) => r.json())
      .then((data: RecentResponse) => {
        setFigures(data.figures ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Drag to scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
    };
    const onUp = () => { isDown = false; el.style.cursor = "grab"; };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX) * 1.2;
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-[var(--brand-primary)]" />
          <h2 className="font-title text-xl font-semibold tracking-tight text-[var(--ink-900)]">
            {title ?? "Últimas incorporaciones"}
          </h2>
        </div>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-[var(--brand-primary)] underline-offset-2 hover:underline"
          >
            Ver todas →
          </a>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ cursor: "grab", WebkitOverflowScrolling: "touch" }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : figures.map((fig) => {
              const rarity = RARITY_CONFIG[fig.rareza] ?? RARITY_CONFIG.COMMON;
              return (
                <Link
                  key={fig.id}
                  href={`/carta/${fig.id}`}
                  className="group flex-none w-[148px] rounded-2xl overflow-hidden border border-[var(--surface-200)] bg-[var(--surface-50)] transition-all duration-200 hover:scale-[1.04] hover:shadow-lg"
                  style={{ boxShadow: `0 0 0 0 ${rarity.color}` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${rarity.color}44`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}
                >
                  <div className="relative h-[148px] w-full overflow-hidden bg-[var(--surface-100)]">
                    <Image
                      src={fig.imagenUrl}
                      alt={fig.nombre}
                      fill
                      sizes="148px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Rarity badge */}
                    <span
                      className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: rarity.bg, color: rarity.color, backdropFilter: "blur(6px)" }}
                    >
                      {rarity.label}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-semibold text-[var(--ink-800)] leading-tight">
                      {fig.nombre}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--ink-500)]">
                      {SERIE_LABEL[fig.serie] ?? fig.serie}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
