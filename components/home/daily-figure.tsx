"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FireIcon,
  GiftIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface DailyFigureData {
  figure: {
    id: number;
    nombre: string;
    imagenUrl: string;
    rareza: string;
    serie: string;
    datoCurioso?: string | null;
  };
  pointsReward: number;
  claimed: boolean;
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
  streakBonus: number;
}

const RARITY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  COMMON: { bg: "bg-slate-100", border: "border-slate-300", glow: "" },
  RARE: { bg: "bg-sky-50", border: "border-sky-400", glow: "shadow-sky-300/40" },
  EPIC: { bg: "bg-violet-50", border: "border-violet-500", glow: "shadow-violet-400/50" },
  LEGENDARY: { bg: "bg-amber-50", border: "border-amber-500", glow: "shadow-amber-400/60" },
  ULTRA: { bg: "bg-rose-50", border: "border-rose-500", glow: "shadow-rose-400/50" },
  MYTHIC: { bg: "bg-gradient-to-br from-fuchsia-50 to-cyan-50", border: "border-fuchsia-500", glow: "shadow-fuchsia-500/60" },
};

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Común",
  RARE: "Rara",
  EPIC: "Épica",
  LEGENDARY: "Legendaria",
  ULTRA: "Ultra",
  MYTHIC: "Mítica",
};

export function DailyFigure() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [data, setData] = useState<DailyFigureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup celebration timer on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // Observe auth state
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/daily", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("No se pudo cargar la figura del día");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when user state changes (to get correct claimed status)
  useEffect(() => {
    if (user !== undefined) {
      fetchData();
    }
  }, [fetchData, user]);

  const handleClaim = async () => {
    if (!user || !data || data.claimed || claiming) return;

    setClaiming(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al reclamar");
      }

      const result = await res.json();
      setJustClaimed(true);
      
      // Update local state
      setData((prev) =>
        prev
          ? {
              ...prev,
              claimed: true,
              streak: {
                currentStreak: result.newStreak,
                longestStreak: Math.max(prev.streak.longestStreak, result.newStreak),
              },
            }
          : null
      );

      // Reset celebration after 3 seconds
      celebrationTimerRef.current = setTimeout(() => setJustClaimed(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reclamar puntos");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || user === undefined) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse bg-slate-100 rounded-2xl h-80" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return null;
  }

  const { figure, pointsReward, claimed, streak, streakBonus } = data;
  const colors = RARITY_COLORS[figure.rareza] || RARITY_COLORS.COMMON;
  const totalPoints = pointsReward + (claimed ? 0 : streakBonus);
  const isLoggedIn = !!user;

  return (
    <section className="py-8 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative rounded-2xl border-2 p-6 overflow-hidden",
            colors.bg,
            colors.border,
            colors.glow && `shadow-lg ${colors.glow}`
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800">Figura del Día</h2>
            </div>
            {streak.currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-medium">
                <FireIcon className="w-4 h-4" />
                {streak.currentStreak} días
              </div>
            )}
          </div>

          {/* Figure Card */}
          <div className="relative flex justify-center mb-4">
            <motion.div
              animate={justClaimed ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="relative w-40 h-48 rounded-xl overflow-hidden bg-white shadow-md"
            >
              <Image
                src={figure.imagenUrl}
                alt={figure.nombre}
                fill
                className="object-contain p-2"
                sizes="160px"
              />
              {/* Rarity badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span className="text-xs font-medium text-white">
                  {RARITY_LABELS[figure.rareza] || figure.rareza}
                </span>
              </div>
            </motion.div>

            {/* Celebration particles */}
            <AnimatePresence>
              {justClaimed && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 1,
                        x: Math.cos((i * Math.PI * 2) / 8) * 80,
                        y: Math.sin((i * Math.PI * 2) / 8) * 80,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-amber-400"
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Figure info */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">{figure.nombre}</h3>
            <p className="text-sm text-slate-500">{figure.serie}</p>
            {figure.datoCurioso && (
              <p className="mt-2 text-xs text-slate-600 italic line-clamp-2">
                &ldquo;{figure.datoCurioso}&rdquo;
              </p>
            )}
          </div>

          {/* Points info */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full">
              <GiftIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">
                +{pointsReward} pts
              </span>
            </div>
            {!claimed && streakBonus > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full">
                <FireIcon className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">
                  +{streakBonus} bonus
                </span>
              </div>
            )}
          </div>

          {/* Action button */}
          {!isLoggedIn ? (
            <Button variant="secondary" className="w-full" asChild>
              <a href="/auth/user">
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Inicia sesión para reclamar
              </a>
            </Button>
          ) : claimed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium">
              <CheckCircleIcon className="w-5 h-5" />
              ¡Ya reclamaste hoy!
            </div>
          ) : (
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {claiming ? (
                "Reclamando..."
              ) : (
                <>
                  <GiftIcon className="w-4 h-4 mr-2" />
                  Reclamar +{totalPoints} puntos
                </>
              )}
            </Button>
          )}

          {/* Streak info at bottom */}
          {streak.longestStreak > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/50 text-center">
              <span className="text-xs text-slate-500">
                Racha más larga: <span className="font-semibold">{streak.longestStreak} días</span>
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
