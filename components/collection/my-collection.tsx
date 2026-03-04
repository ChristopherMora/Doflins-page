"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAuthModal } from "@/components/auth/user-auth-modal";
import { AchievementsPanel } from "@/components/collection/achievements-panel";

interface DoflinRow {
  id: number;
  nombre: string;
  modeloBase: string;
  variante: string;
  slug: string;
  serie: string;
  numeroColeccion: number;
  rareza: string;
  probabilidad: number;
  imagenUrl: string;
  siluetaUrl: string;
}

interface CollectionData {
  doflins: DoflinRow[];
  ownedIds: number[];
}

const RARITY_ORDER = ["COMMON", "RARE", "EPIC", "LEGENDARY", "ULTRA", "MYTHIC"];
const RARITY_LABELS: Record<string, string> = {
  COMMON: "Común",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Legendario",
  ULTRA: "Ultra",
  MYTHIC: "Mítico",
};
const RARITY_COLORS: Record<string, string> = {
  COMMON: "bg-[#e8f2d6] text-[#2f5b1f]",
  RARE: "bg-[#dbe4ff] text-[#24336c]",
  EPIC: "bg-[#f0dbff] text-[#5a1a8a]",
  LEGENDARY: "bg-[#ffe9b5] text-[#5e4300]",
  ULTRA: "bg-[#ffd6d6] text-[#7a1a1a]",
  MYTHIC: "bg-[#ffd6f5] text-[#6b006b]",
};

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHUlEQVQIW2NkYGD4z8BQDwIMjIz1DEDMSNMAACb9Av9aFEHzAAAAAElFTkSuQmCC";

export function MyCollection() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [data, setData] = useState<CollectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [showOwned, setShowOwned] = useState<"all" | "owned" | "missing">("all");

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }

    const loadCollection = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/collection/user");
        if (!res.ok) throw new Error("Error cargando colección");
        const json = (await res.json()) as CollectionData;
        setData(json);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    void loadCollection();
  }, [user]);

  const ownedSet = useMemo(() => new Set(data?.ownedIds ?? []), [data]);

  const byRarity = useMemo(() => {
    if (!data) return {};
    const map: Record<string, { total: number; owned: number }> = {};
    for (const d of data.doflins) {
      if (!map[d.rareza]) map[d.rareza] = { total: 0, owned: 0 };
      map[d.rareza].total++;
      if (ownedSet.has(d.id)) map[d.rareza].owned++;
    }
    return map;
  }, [data, ownedSet]);

  const filteredDoflins = useMemo(() => {
    if (!data) return [];
    let list = data.doflins;
    if (activeFilter !== "ALL") list = list.filter((d) => d.rareza === activeFilter);
    if (showOwned === "owned") list = list.filter((d) => ownedSet.has(d.id));
    if (showOwned === "missing") list = list.filter((d) => !ownedSet.has(d.id));
    return list.sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rareza);
      const rb = RARITY_ORDER.indexOf(b.rareza);
      return ra !== rb ? rb - ra : a.numeroColeccion - b.numeroColeccion;
    });
  }, [data, activeFilter, showOwned, ownedSet]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setData(null);
  };

  const toggleOwned = async (doflinId: number) => {
    if (!user) return;
    const wasOwned = ownedSet.has(doflinId);
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const newOwnedIds = wasOwned
        ? prev.ownedIds.filter((id) => id !== doflinId)
        : [...prev.ownedIds, doflinId];
      return { ...prev, ownedIds: newOwnedIds };
    });
    await fetch("/api/collection/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doflinId, owned: !wasOwned }),
    });
  };

  // — NOT LOGGED IN —
  if (!user) {
    return (
      <div className="space-y-6">
        {isAuthModalOpen && (
          <UserAuthModal
            onClose={() => setIsAuthModalOpen(false)}
            redirectTo="/coleccion"
          />
        )}

        {/* Back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--ink-500)] transition hover:bg-black/[0.05] hover:text-[var(--ink-900)]"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Volver
          </Link>
        </div>

        <div className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5df]">
            <LockClosedIcon className="h-7 w-7 text-[#4e6f2a]" />
          </div>
          <div className="space-y-2">
            <h2 className="font-title text-2xl font-bold text-[var(--ink-900)]">Tu colección te espera</h2>
            <p className="mx-auto max-w-xs text-sm text-[var(--ink-500)]">
              Inicia sesión para ver qué figuras has conseguido, cuánto te falta y compartir tu progreso.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-7 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-95"
          >
            <SparklesIcon className="h-4 w-4" /> Iniciar sesión gratis
          </button>
          <p className="text-xs text-[var(--ink-400)]">Gratis · Solo con Google · Sin contraseña</p>
        </div>
      </div>
    );
  }

  // — LOADING —
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
          <p className="text-sm text-[var(--ink-600)]">Cargando tu colección…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalOwned = data.ownedIds.length;
  const totalDoflins = data.doflins.length;
  const pct = totalDoflins > 0 ? Math.round((totalOwned / totalDoflins) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-700)] hover:bg-[#f4f6e8] transition"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Volver al inicio
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-[var(--ink-900)]">Mi Colección</h1>
          <p className="text-sm text-[var(--ink-600)]">{user.email}</p>
        </div>
        <button
          onClick={() => void handleSignOut()}
          className="flex items-center gap-2 rounded-full border border-[#d8d2b4] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] hover:bg-[#f4f6e8] transition"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>

      {/* Progress overview */}
      <Card className="border border-[#d9cfad] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">
                Progreso total
              </p>
              <p className="font-title text-4xl text-[var(--ink-900)]">
                {totalOwned}
                <span className="text-xl text-[var(--ink-600)]">/{totalDoflins}</span>
              </p>
            </div>
            <p className="font-title text-5xl text-[#4e6f2a]">{pct}%</p>
          </div>
          <div className="h-3 rounded-full bg-[#d8dfc5] overflow-hidden">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4e6f2a,#8ab53c)] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* By rarity */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RARITY_ORDER.filter((r) => byRarity[r]).map((rarity) => {
              const { total, owned } = byRarity[rarity];
              const rarityPct = Math.round((owned / total) * 100);
              return (
                <div
                  key={rarity}
                  className="rounded-2xl border border-[#d8d2b4] bg-white/70 px-3 py-2 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs px-2 py-0.5 rounded-full ${RARITY_COLORS[rarity]}`}>
                      {RARITY_LABELS[rarity] ?? rarity}
                    </Badge>
                    <span className="text-xs font-bold text-[var(--ink-800)]">
                      {owned}/{total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#e0e8d0] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4e6f2a]"
                      style={{ width: `${rarityPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <AchievementsPanel
        input={{
          totalOwned,
          totalDoflins,
          ownedByRarity: Object.fromEntries(
            Object.entries(byRarity).map(([r, v]) => [r.toLowerCase(), v.owned]),
          ),
          totalByRarity: Object.fromEntries(
            Object.entries(byRarity).map(([r, v]) => [r.toLowerCase(), v.total]),
          ),
          series: [...new Set(data.doflins.filter((d) => ownedSet.has(d.id)).map((d) => d.serie))],
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["ALL", ...RARITY_ORDER.filter((r) => byRarity[r])].map((r) => (
          <button
            key={r}
            onClick={() => setActiveFilter(r)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === r
                ? "bg-[#4e6f2a] text-white shadow-sm"
                : "border border-[#d8d2b4] bg-white text-[var(--ink-700)] hover:bg-[#f4f6e8]"
            }`}
          >
            {r === "ALL" ? "Todas" : RARITY_LABELS[r] ?? r}
          </button>
        ))}
        <div className="ml-auto flex rounded-full border border-[#d8d2b4] overflow-hidden">
          {(["all", "owned", "missing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setShowOwned(f)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                showOwned === f ? "bg-[#4e6f2a] text-white" : "bg-white text-[var(--ink-700)] hover:bg-[#f4f6e8]"
              }`}
            >
              {f === "all" ? "Todas" : f === "owned" ? "Tengo" : "Me faltan"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredDoflins.map((doflin) => {
          const owned = ownedSet.has(doflin.id);
          return (
            <button
              key={doflin.id}
              onClick={() => void toggleOwned(doflin.id)}
              className={`group relative overflow-hidden rounded-2xl border text-left transition hover:scale-[1.03] active:scale-[0.98] ${
                owned
                  ? "border-[#a0c070] bg-[linear-gradient(145deg,#edfad4,#d8f0b0)]"
                  : "border-[#d8d2b4] bg-[linear-gradient(145deg,#f5f5f0,#eeede4)]"
              }`}
              aria-label={`${owned ? "Quitar" : "Marcar como obtenida"}: ${doflin.nombre}`}
            >
              {/* Image */}
              <div className="relative aspect-square w-full overflow-hidden">
                {owned ? (
                  <Image
                    src={doflin.imagenUrl}
                    alt={doflin.nombre}
                    fill
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <Image
                      src={doflin.siluetaUrl}
                      alt={`Silueta ${doflin.nombre}`}
                      fill
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-contain p-2 opacity-30"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LockClosedIcon className="h-8 w-8 text-[var(--ink-400)]" />
                    </div>
                  </div>
                )}
                {owned && (
                  <div className="absolute right-1 top-1 rounded-full bg-[#4e6f2a] p-0.5">
                    <CheckCircleIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2 space-y-1">
                <Badge className={`text-xs px-2 py-0.5 rounded-full ${RARITY_COLORS[doflin.rareza]}`}>
                  {RARITY_LABELS[doflin.rareza] ?? doflin.rareza}
                </Badge>
                <p className="text-xs font-semibold leading-tight text-[var(--ink-900)] truncate">
                  {doflin.nombre}
                </p>
                <p className="text-xs text-[var(--ink-600)]">#{doflin.numeroColeccion}</p>
              </div>
            </button>
          );
        })}
      </div>

      {filteredDoflins.length === 0 && (
        <div className="py-12 text-center">
          <XMarkIcon className="mx-auto h-8 w-8 text-[var(--ink-400)]" />
          <p className="mt-2 text-sm text-[var(--ink-600)]">Sin resultados para este filtro.</p>
        </div>
      )}
    </div>
  );
}
