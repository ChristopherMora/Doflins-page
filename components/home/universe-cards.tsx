"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { broadcastUniverse } from "@/lib/universe-store";

interface FeaturedFigure {
  id: number;
  imagenUrl: string;
  nombre: string;
  rareza: string;
}

interface FeaturedResponse {
  featured: {
    animals: FeaturedFigure[];
    mega: FeaturedFigure[];
    multiverse: FeaturedFigure[];
  };
}

const UNIVERSES = [
  {
    key: "animals" as const,
    title: "Animals",
    emoji: "🐆",
    tagline: "Naturaleza viva. Rarezas salvajes.",
    hoverDesc: "Reptiles, mamíferos y aves en 4 niveles de rareza. ¿Atraparás al MYTHIC?",
    peakLabel: "Mítico",
    peakColor: "#f59e0b",
    href: "/reveal?universe=animals",
    gradient: "from-[#f0f9e8] via-[#dff0c4] to-[#cce6a8]",
    border: "border-[#a8cc80]",
    glow: "rgba(78,111,42,0.18)",
    titleColor: "text-[#1f3618]",
    tagColor: "text-[#3d5a32]",
    btnBg: "bg-[#3a7a28] hover:bg-[#2e6820]",
    cardRing: "ring-[#b8d8a0]",
    figureKey: "animals" as const,
  },
  {
    key: "mega" as const,
    title: "Mega",
    emoji: "🦣",
    tagline: "Escala XL. Presencia épica.",
    hoverDesc: "Figuras de tamaño XL con detalles únicos. Coleccionalas todas antes de que se agoten.",
    peakLabel: "Legendario",
    peakColor: "#a855f7",
    href: "/reveal?universe=mega",
    gradient: "from-[#fefae6] via-[#fef0b8] to-[#fde490]",
    border: "border-[#ddc060]",
    glow: "rgba(196,124,32,0.18)",
    titleColor: "text-[#6a4210]",
    tagColor: "text-[#a06020]",
    btnBg: "bg-[#c47c20] hover:bg-[#a86818]",
    cardRing: "ring-[#e0c878]",
    figureKey: "mega" as const,
  },
  {
    key: "multiverse" as const,
    title: "Multiverse",
    emoji: "⚡",
    tagline: "Variantes intensas. Energía sci-fi.",
    hoverDesc: "Versiones alternativas con efectos visuales exclusivos. Energía al máximo.",
    peakLabel: "Ultra",
    peakColor: "#f97316",
    href: "/reveal?universe=multiverse",
    gradient: "from-[#edf0ff] via-[#dde4ff] to-[#c8d4ff]",
    border: "border-[#9aaae8]",
    glow: "rgba(68,96,208,0.18)",
    titleColor: "text-[#1c2a6a]",
    tagColor: "text-[#2840a0]",
    btnBg: "bg-[#4460d0] hover:bg-[#3850b8]",
    cardRing: "ring-[#b8c6f8]",
    figureKey: "multiverse" as const,
  },
] as const;

// Posiciones del abanico: izquierda, centro, derecha
const FAN = [
  { rotate: "-13deg", dx: -36, dy: 6, z: 0, scale: 0.93 },
  { rotate: "0deg",   dx: 0,   dy: -4, z: 10, scale: 1 },
  { rotate: "13deg",  dx: 36,  dy: 6, z: 0, scale: 0.93 },
];

interface UniverseCardsProps {
  initialFeatured?: FeaturedResponse["featured"];
}

export function UniverseCards({ initialFeatured }: UniverseCardsProps = {}): React.JSX.Element {
  const [featured, setFeatured] = useState<FeaturedResponse["featured"] | null>(initialFeatured ?? null);

  useEffect(() => {
    if (initialFeatured) return; // ya tenemos datos del servidor
    fetch("/api/universe/featured")
      .then((r) => (r.ok ? (r.json() as Promise<FeaturedResponse>) : null))
      .then((d) => { if (d) setFeatured(d.featured); })
      .catch(() => null);
  }, [initialFeatured]);

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-title text-2xl font-bold text-[var(--ink-900)] sm:text-3xl">
          Tres universos. Una colección única.
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {UNIVERSES.map((u) => {
          const figs = featured?.[u.figureKey] ?? [];
          const hasFigs = figs.length >= 3;

          return (
            <Link
              key={u.key}
              href={u.href}
              onClick={() => broadcastUniverse(u.key)}
              className={`group relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border bg-gradient-to-b ${u.gradient} ${u.border} px-5 pb-6 pt-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98]`}
            >
              {/* Background glow */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-36 opacity-60"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${u.glow} 0%, transparent 70%)`,
                }}
              />

              {/* Peak rarity badge */}
              <span
                className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                style={{ background: u.peakColor }}
              >
                ✦ Hasta {u.peakLabel}
              </span>

              {/* Figure fan */}
              <div className={`relative w-full shrink-0 ${u.key === "mega" ? "h-[136px]" : "h-[116px]"}`}>
                {hasFigs ? (
                  figs.slice(0, 3).map((fig, i) => {
                    const f = FAN[i]!;
                    const isMega = u.key === "mega";
                    const cardW = isMega ? 88 : 76;
                    const cardH = isMega ? 116 : 100;
                    return (
                      <div
                        key={fig.id}
                        className="absolute left-1/2"
                        style={{
                          transform: `translateX(calc(-50% + ${isMega ? f.dx * 1.15 : f.dx}px)) translateY(${f.dy}px) rotate(${f.rotate}) scale(${f.scale})`,
                          zIndex: f.z,
                          width: cardW,
                          height: cardH,
                          transformOrigin: "bottom center",
                        }}
                      >
                        <div
                          className={`h-full w-full overflow-hidden rounded-2xl bg-white/90 shadow-lg ring-2 ${u.cardRing} transition-transform duration-300 group-hover:shadow-xl`}
                          style={{ boxShadow: `0 8px 24px ${u.glow}` }}
                        >
                          <Image
                            src={fig.imagenUrl}
                            alt={fig.nombre}
                            width={cardW}
                            height={cardH}
                            className="h-full w-full object-cover"
                            priority
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Cargando o sin figuras */
                  <div className="flex h-full w-full items-center justify-center">
                    {featured === null ? (
                      // skeleton
                      <div className="flex items-end gap-[-8px]">
                        {FAN.map((f, i) => (
                          <div
                            key={i}
                            className="absolute left-1/2 animate-pulse rounded-2xl bg-white/60"
                            style={{
                              transform: `translateX(calc(-50% + ${f.dx}px)) translateY(${f.dy}px) rotate(${f.rotate}) scale(${f.scale})`,
                              zIndex: f.z,
                              width: 76,
                              height: 100,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-5xl opacity-30 select-none">{u.emoji}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="space-y-1.5 relative z-10">
                {u.key === "mega" ? (
                  <h3 className={`font-title text-2xl font-black sm:text-3xl ${u.titleColor}`} style={{ textShadow: "0 2px 12px rgba(196,124,32,0.15)" }}>
                    MEGA
                  </h3>
                ) : (
                  <h3 className={`font-title text-xl font-bold sm:text-2xl ${u.titleColor}`}>
                    {u.title}
                  </h3>
                )}
                <p className={`text-sm leading-relaxed ${u.tagColor}`}>{u.tagline}</p>
                <p className={`text-xs leading-relaxed transition-all duration-200 ${u.tagColor} opacity-0 group-hover:opacity-80 -mt-0.5`}>
                  {u.hoverDesc}
                </p>
              </div>

              {/* CTA */}
              <span
                className={`relative z-10 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 ${u.btnBg} group-hover:shadow-lg group-hover:brightness-110`}
              >
                Explorar{" "}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

