"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, ShoppingCartIcon, SparklesIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { BolsaSaveWidget } from "@/components/bolsa/bolsa-save-widget";
import { ShareButton } from "@/components/bolsa/share-button";
import { useRevealSounds } from "@/lib/hooks/use-reveal-sounds";
import { useConfetti } from "@/lib/hooks/use-confetti";

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

// ─── Celebración para rarezas altas ──────────────────────────────────────────

const CELEBRATION_CONFIG: Record<string, {
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  glowColor: string;
  textColor: string;
  ringColor: string;
}> = {
  MYTHIC:    { emoji: "✨", title: "¡MÍTICO!",     subtitle: "Una figura extremadamente rara",  gradient: "linear-gradient(145deg,#2d0a4e,#7b2fa8)", glowColor: "rgba(155,93,229,0.7)",  textColor: "#f5ccff", ringColor: "#c77ce0" },
  ULTRA:     { emoji: "💥", title: "¡ULTRA RARO!", subtitle: "Una rareza casi imposible",        gradient: "linear-gradient(145deg,#4e0a0a,#a83030)", glowColor: "rgba(192,57,43,0.7)",   textColor: "#ffd4d4", ringColor: "#e07c7c" },
  LEGENDARY: { emoji: "⭐", title: "¡LEGENDARIO!", subtitle: "Una figura legendaria en tu pack", gradient: "linear-gradient(145deg,#4e3a0a,#a88010)", glowColor: "rgba(212,160,23,0.7)",  textColor: "#fff0c0", ringColor: "#e0c07c" },
  EPIC:      { emoji: "🔥", title: "¡ÉPICO!",      subtitle: "Una figura épica para tu colección",gradient:"linear-gradient(145deg,#4e2a0a,#a85020)", glowColor: "rgba(184,101,40,0.7)",  textColor: "#ffe0c0", ringColor: "#e0a07c" },
};

function CelebrationOverlay({
  item,
  rarity,
  onDismiss,
}: {
  item: DoflinRevealItem;
  rarity: string;
  onDismiss: () => void;
}): React.JSX.Element {
  const cfg = CELEBRATION_CONFIG[rarity] ?? CELEBRATION_CONFIG.EPIC!;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onDismiss}
    >
      <div
        className="animate-celebration-scale-in relative w-full max-w-xs overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: cfg.gradient }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ background: "repeating-linear-gradient(45deg,white 0,transparent 2px,transparent 20px,white 22px)" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 p-7 text-center">
          {/* Emoji flotante */}
          <div className="animate-bounce text-6xl select-none">{cfg.emoji}</div>

          {/* Título */}
          <div>
            <p
              className="font-title text-3xl font-black tracking-wider"
              style={{ color: cfg.textColor, textShadow: `0 0 24px ${cfg.glowColor}` }}
            >
              {cfg.title}
            </p>
            <p className="mt-1 text-sm" style={{ color: `${cfg.textColor}bb` }}>
              {cfg.subtitle}
            </p>
          </div>

          {/* Figura destacada */}
          <div
            className="animate-celebration-glow overflow-hidden rounded-2xl"
            style={{ ["--glow-color" as string]: cfg.glowColor, border: `3px solid ${cfg.ringColor}` }}
          >
            <div className="animate-celebration-float relative h-36 w-36">
              <Image
                src={item.imagenUrl || item.siluetaUrl}
                alt={item.nombre}
                fill
                sizes="144px"
                className="object-contain p-2"
              />
            </div>
            <div className="bg-black/40 px-3 py-1.5">
              <p className="text-sm font-bold" style={{ color: cfg.textColor }}>{item.nombre}</p>
              <p className="text-[10px]" style={{ color: `${cfg.textColor}99` }}>
                {item.serie} · #{String(item.numeroColeccion).padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* Botón dismiss */}
          <button
            onClick={onDismiss}
            className="rounded-full px-7 py-2.5 text-sm font-black transition active:scale-95"
            style={{
              background: "rgba(255,255,255,0.18)",
              color: cfg.textColor,
              border: `1px solid ${cfg.ringColor}55`,
            }}
          >
            ¡A guardar mi figura! →
          </button>
          <p className="text-[10px]" style={{ color: `${cfg.textColor}66` }}>
            Toca en cualquier lugar para cerrar
          </p>
        </div>
      </div>
    </div>
  );
}

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const sounds = useRevealSounds();
  const confetti = useConfetti();

  const flip = useCallback((id: number, rarity: string) => {
    setRevealed((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    // Play reveal sound based on rarity
    sounds.playReveal(rarity);
  }, [sounds]);

  const revealAll = useCallback(() => {
    setRevealed(new Set(items.map((i) => i.id)));
    // Play whoosh for reveal all
    sounds.playWhoosh();
  }, [items, sounds]);

  const allDone = revealed.size === items.length;

  const autoReveal = async () => {
    setIsAutoRevealing(true);
    for (const item of items) {
      setHighlightId(item.id);
      await new Promise<void>((r) => setTimeout(r, 250));
      flip(item.id, item.rareza);
      await new Promise<void>((r) => setTimeout(r, 700));
    }
    setHighlightId(null);
    setIsAutoRevealing(false);
  };

  const topRarity = RARITY_ORDER.find((r) => items.some((d) => d.rareza === r)) ?? "COMMON";
  const hasSpecial = topRarity !== "COMMON" && topRarity !== "RARE";

  // Encontrar la figura de mayor rareza para la celebración
  const topItem = (() => {
    for (const r of RARITY_ORDER) {
      const found = items.find((d) => d.rareza === r);
      if (found) return found;
    }
    return items[0];
  })();

  // Update sound enabled state
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled, sounds]);

  // Warm up audio on mount
  useEffect(() => {
    sounds.warmUp();
  }, [sounds]);

  // Disparar celebración cuando se revelan todas las cartas y hay rareza especial
  useEffect(() => {
    if (allDone && hasSpecial) {
      const t = window.setTimeout(() => {
        setShowCelebration(true);
        // Fire confetti and celebration sound
        confetti.fire({ rarity: topRarity, particleCount: 120, duration: 3500 });
        sounds.playCelebration(topRarity);
      }, 450);
      return () => window.clearTimeout(t);
    }
  }, [allDone, hasSpecial, topRarity, confetti, sounds]);

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="relative"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#eaf5d8] text-5xl shadow-lg ring-4 ring-[#9acd42]/30">
            🎴
          </div>
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#4e6f2a] text-sm font-black text-white shadow">
            {items.length}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="space-y-2"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Button
              size="lg"
              className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-8 text-base font-bold shadow-lg"
              onClick={() => {
                sounds.warmUp();
                setStarted(true);
              }}
            >
              <SparklesIcon className="h-5 w-5" />
              Comenzar a abrir →
            </Button>
          </motion.div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[var(--ink-500)] transition hover:bg-black/5"
          >
            {soundEnabled ? (
              <SpeakerWaveIcon className="h-4 w-4" />
            ) : (
              <SpeakerXMarkIcon className="h-4 w-4" />
            )}
            Sonido {soundEnabled ? "activado" : "desactivado"}
          </button>
        </motion.div>

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
        <AnimatePresence>
        {items.map((item, cardIndex) => {
          const isFlipped = revealed.has(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.36, delay: cardIndex * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
            <div
              className={`card-3d-wrap cursor-pointer transition-all duration-200 ${highlightId === item.id && !isFlipped ? "scale-105 ring-4 ring-[#9acd42] ring-offset-2 rounded-2xl" : ""}`}
              style={{ height: "228px" }}
              onClick={() => {
                if (!isFlipped && !isAutoRevealing) flip(item.id, item.rareza);
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
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
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
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {/* Reveal all button / done state */}
      {!allDone ? (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            disabled={isAutoRevealing}
            onClick={() => void autoReveal()}
            className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"
          >
            <SparklesIcon className="h-4 w-4" />
            {isAutoRevealing ? "Revelando…" : "Auto-revelar"}
          </Button>
          <Button variant="secondary" size="sm" disabled={isAutoRevealing} onClick={revealAll}>
            <EyeIcon className="h-4 w-4" />
            De golpe
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

      {/* Celebración al revelar figura rara */}
      {showCelebration && topItem ? (
        <CelebrationOverlay
          item={topItem}
          rarity={topRarity}
          onDismiss={() => setShowCelebration(false)}
        />
      ) : null}
    </div>
  );
}
