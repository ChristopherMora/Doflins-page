"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, ShoppingCartIcon, SparklesIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { BolsaSaveWidget } from "@/components/bolsa/bolsa-save-widget";
import { ShareButton } from "@/components/bolsa/share-button";

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Común",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Legendario",
  ULTRA: "Ultra",
  MYTHIC: "Mítico",
};

const RARITY_GRADIENT: Record<string, string> = {
  COMMON: "from-[#eef1e8] to-[#dde3d4]",
  RARE: "from-[#e0f3ea] to-[#c8e8d8]",
  EPIC: "from-[#fdf0e4] to-[#f5dfc0]",
  LEGENDARY: "from-[#fdf5e0] to-[#f5e5b0]",
  ULTRA: "from-[#fde8e8] to-[#f5c8c8]",
  MYTHIC: "from-[#f5e0fd] to-[#e8c0f5]",
};

const RARITY_TEXT: Record<string, string> = {
  COMMON: "text-[#5a6650]",
  RARE: "text-[#2e6040]",
  EPIC: "text-[#8a4820]",
  LEGENDARY: "text-[#8a6020]",
  ULTRA: "text-[#8a2020]",
  MYTHIC: "text-[#6020a0]",
};

const RARITY_GLOW: Record<string, string> = {
  COMMON: "",
  RARE: "",
  EPIC: "shadow-[0_0_28px_rgba(180,106,45,0.45)]",
  LEGENDARY: "shadow-[0_0_36px_rgba(213,154,26,0.55)]",
  ULTRA: "shadow-[0_0_36px_rgba(179,58,44,0.55)]",
  MYTHIC: "shadow-[0_0_40px_rgba(155,93,229,0.6)]",
};

const RARITY_ORDER = ["MYTHIC", "ULTRA", "LEGENDARY", "EPIC", "RARE", "COMMON"] as const;

export interface DoflinRevealItem {
  id: number;
  nombre: string;
  serie: string;
  numeroColeccion: number;
  rareza: string;
  imagenUrl: string;
  siluetaUrl: string;
  datoCurioso: string | null;
}

export function BolsaRevealExperience({
  items,
  packSize,
  codigo,
}: {
  items: DoflinRevealItem[];
  packSize: number;
  codigo: string;
}) {
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const flip = (id: number) =>
    setRevealed((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
  const revealAll = () => setRevealed(new Set(items.map((i) => i.id)));
  const allDone = revealed.size === items.length;

  const topRarity = RARITY_ORDER.find((r) => items.some((d) => d.rareza === r)) ?? "COMMON";
  const hasSpecial = topRarity !== "COMMON" && topRarity !== "RARE";

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4 py-12 text-center">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#eaf5d8] text-5xl shadow-lg ring-4 ring-[#9acd42]/30">
            🎴
          </div>
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#4e6f2a] text-sm font-black text-white shadow">
            {items.length}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-title text-3xl font-black text-[var(--ink-900)]">
            ¡Tu bolsa está lista!
          </h1>
          <p className="text-sm text-[var(--ink-500)]">
            Pack ×{packSize} · {items.length} figura{items.length !== 1 ? "s" : ""} · Código{" "}
            <code className="font-mono font-bold text-[#4e6f2a]">{codigo}</code>
          </p>
          {hasSpecial ? (
            <p className={`text-xs font-bold ${RARITY_TEXT[topRarity] ?? ""}`}>
              ✨ ¡Hay al menos un{" "}
              <span className="uppercase tracking-wide">{RARITY_LABELS[topRarity]}</span>!
            </p>
          ) : null}
        </div>

        <Button
          size="lg"
          className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-8 text-base font-bold shadow-lg"
          onClick={() => setStarted(true)}
        >
          <SparklesIcon className="h-5 w-5" />
          Comenzar a abrir →
        </Button>

        <p className="text-xs text-[var(--ink-400)]">Toca cada carta para revelarla</p>
      </div>
    );
  }

  // ── Reveal screen ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-[var(--ink-600)]">
          <span>Reveladas</span>
          <span>
            {revealed.size} / {items.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[#4e6f2a] transition-all duration-500"
            style={{ width: `${(revealed.size / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const isFlipped = revealed.has(item.id);
          return (
            <div
              key={item.id}
              className="card-3d-wrap"
              style={{ height: "228px" }}
              onClick={() => {
                if (!isFlipped) flip(item.id);
              }}
            >
              <div
                className={`card-3d-inner ${isFlipped ? "card-3d-flipped" : ""}`}
                style={{ height: "228px" }}
              >
                {/* Front: mystery */}
                <div className="card-3d-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2a3a18,#3d5522)] shadow-md">
                  <span className="text-4xl">🎴</span>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
                    Toca para revelar
                  </span>
                </div>

                {/* Back: revealed card */}
                <div
                  className={`card-3d-back absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-b ${RARITY_GRADIENT[item.rareza] ?? "from-[#f5f5f0] to-[#ebebeb]"} shadow-md ${RARITY_GLOW[item.rareza] ?? ""}`}
                >
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={item.imagenUrl || item.siluetaUrl}
                      alt={item.nombre}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span
                        className={`inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold ${RARITY_TEXT[item.rareza] ?? "text-[#666]"}`}
                      >
                        {RARITY_LABELS[item.rareza] ?? item.rareza}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-semibold leading-tight text-[var(--ink-900)]">
                      {item.nombre}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-500)]">
                      {item.serie} ·{" "}
                      <span className="font-mono">
                        #{String(item.numeroColeccion).padStart(2, "0")}
                      </span>
                    </p>
                    {item.datoCurioso ? (
                      <p className="mt-1 line-clamp-2 text-[9px] italic leading-snug text-[var(--ink-600)]">
                        &ldquo;{item.datoCurioso}&rdquo;
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reveal all button / done state */}
      {!allDone ? (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" size="sm" onClick={revealAll}>
            <EyeIcon className="h-4 w-4" />
            Revelar todas de golpe
          </Button>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div className="rounded-2xl bg-[#eaf5d8] p-4 text-center">
            <p className="text-base font-bold text-[#4e6f2a]">
              🎉 ¡Bolsa completamente revelada!
            </p>
          </div>

          <BolsaSaveWidget codigo={codigo} doflinCount={items.length} />
          <ShareButton codigo={codigo} itemCount={items.length} />

          <div className="flex items-center gap-4 rounded-2xl bg-[var(--surface-100)] p-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--ink-900)]">¿Quieres más figuras?</p>
              <p className="text-xs text-[var(--ink-500)]">
                Consigue más packs y completa tu colección
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"
            >
              <Link href="/#compras">
                <ShoppingCartIcon className="h-3.5 w-3.5" /> Ver packs
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
