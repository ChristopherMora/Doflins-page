"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Figure {
  id: number;
  imagenUrl: string;
  nombre: string;
  rareza: string;
}

interface FeaturedResponse {
  featured: Record<string, Figure[]>;
}

const RARITY_GLOW: Record<string, string> = {
  MYTHIC: "rgba(255, 180, 0, 0.55)",
  ULTRA: "rgba(255, 110, 0, 0.45)",
  LEGENDARY: "rgba(200, 80, 255, 0.45)",
  EPIC: "rgba(100, 80, 255, 0.38)",
  RARE: "rgba(40, 140, 255, 0.35)",
  COMMON: "rgba(100, 180, 80, 0.28)",
};

// Posiciones fijas para las 4 figuras flotantes alrededor del hero
const POSITIONS = [
  { top: "8%",  left: "-2%",  size: 110, delay: "0s",    duration: "5.8s", rotate: "-12deg" },
  { top: "5%",  right: "-2%", size: 120, delay: "1.2s",  duration: "6.4s", rotate: "10deg"  },
  { top: "55%", left: "1%",   size: 96,  delay: "0.6s",  duration: "7.1s", rotate: "-8deg"  },
  { top: "60%", right: "0%",  size: 104, delay: "1.8s",  duration: "5.5s", rotate: "14deg"  },
];

interface HeroFloatingFiguresProps {
  initialFigures?: Figure[];
}

export function HeroFloatingFigures({ initialFigures = [] }: HeroFloatingFiguresProps): React.JSX.Element | null {
  const [figures, setFigures] = useState<Figure[]>(initialFigures);

  useEffect(() => {
    if (initialFigures.length > 0) return; // ya tenemos datos del servidor
    fetch("/api/universe/featured")
      .then((r) => r.json())
      .then((data: FeaturedResponse) => {
        const all = Object.values(data.featured ?? {}).flat();
        const seen = new Set<number>();
        const unique = all.filter((f) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
        setFigures(unique.slice(0, 4));
      })
      .catch(() => {});
  }, [initialFigures.length]);

  if (figures.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {figures.map((fig, i) => {
        const pos = POSITIONS[i];
        if (!pos) return null;
        const glow = RARITY_GLOW[fig.rareza] ?? RARITY_GLOW.COMMON;

        return (
          <div
            key={fig.id}
            className="absolute select-none"
            style={{
              top: pos.top,
              left: "left" in pos ? pos.left : undefined,
              right: "right" in pos ? pos.right : undefined,
              width: pos.size,
              height: pos.size,
              transform: `rotate(${pos.rotate})`,
              animation: `heroFloat ${pos.duration} ease-in-out ${pos.delay} infinite`,
              filter: `drop-shadow(0 8px 24px ${glow})`,
              opacity: 0.72,
            }}
          >
            <Image
              src={fig.imagenUrl}
              alt={fig.nombre}
              width={pos.size}
              height={pos.size}
              className="h-full w-full rounded-2xl object-cover"
              sizes={`${pos.size}px`}
              priority
            />
          </div>
        );
      })}

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50%       { transform: translateY(-18px) rotate(var(--r, 0deg)); }
        }
      `}</style>
    </div>
  );
}
