"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CollectionItemDTO } from "@/lib/types/doflin";
import {
  CheckCircleIcon,
  LockClosedIcon,
  ShareIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { UserAuthModal } from "@/components/auth/user-auth-modal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ─── Constantes ───────────────────────────────────────────────────────────────

const RARITY_ORDER = ["COMMON", "RARE", "EPIC", "LEGENDARY", "ULTRA", "MYTHIC"];
const RARITY_LABELS: Record<string, string> = {
  COMMON:    "Común",
  RARE:      "Raro",
  EPIC:      "Épico",
  LEGENDARY: "Legendario",
  ULTRA:     "Ultra",
  MYTHIC:    "Mítico",
};
const RARITY_CONFIG: Record<string, { color: string; soft: string; accent: string }> = {
  COMMON:    { color: "#5a6650", soft: "#eef1e8", accent: "#b8c4a8" },
  RARE:      { color: "#2e6040", soft: "#e0f3ea", accent: "#90c8a8" },
  EPIC:      { color: "#8a4820", soft: "#fdf0e4", accent: "#d89060" },
  LEGENDARY: { color: "#7a5010", soft: "#fdf5e0", accent: "#e8c060" },
  ULTRA:     { color: "#8a2020", soft: "#fde8e8", accent: "#e08080" },
  MYTHIC:    { color: "#6020a0", soft: "#f5e0fd", accent: "#c090e0" },
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DoflinRow {
  id: number;
  nombre: string;
  modeloBase: string;
  variante: string;
  slug?: string;
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

type GroupedBySeries = Record<string, Record<string, DoflinRow[]>>;

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHUlEQVQIW2NkYGD4z8BQDwIMjIz1DEDMSNMAACb9Av9aFEHzAAAAAElFTkSuQmCC";

// ─── Componente principal ─────────────────────────────────────────────────────

export function PaniniAlbum({ initialDoflins }: { initialDoflins?: CollectionItemDTO[] }): React.JSX.Element {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const mappedInitial: CollectionData | null = initialDoflins && initialDoflins.length > 0
    ? {
        doflins: initialDoflins.map((item) => ({
          id: item.id,
          nombre: item.name,
          modeloBase: item.baseModel,
          variante: item.variantName,
          serie: item.series,
          numeroColeccion: item.collectionNumber,
          rareza: item.rarity,
          probabilidad: item.probability,
          imagenUrl: item.imageUrl,
          siluetaUrl: item.silhouetteUrl ?? "",
        })),
        ownedIds: [],
      }
    : null;
  const [data, setData] = useState<CollectionData | null>(mappedInitial);
  const [isLoading, setIsLoading] = useState(mappedInitial === null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [showMissing, setShowMissing] = useState(false);
  const [justMarked, setJustMarked] = useState<number | null>(null);

  const ownedSet = useMemo(() => new Set(data?.ownedIds ?? []), [data]);

  // Auth observer
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos (esperar resolución de auth)
  useEffect(() => {
    if (user === undefined) return;
    void (async () => {
      // Si el usuario no está logueado y ya tenemos datos pre-cargados, no hacer fetch
      if (!user && mappedInitial) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      if (!user) {
        const res = await fetch("/api/collection");
        if (res.ok) {
          const d = (await res.json()) as { collection: DoflinRow[] };
          setData({ doflins: d.collection, ownedIds: [] });
        }
      } else {
        const res = await fetch("/api/collection/user");
        if (res.ok) {
          const d = (await res.json()) as CollectionData;
          setData(d);
        }
      }
      setIsLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSticker = async (id: number) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const wasOwned = ownedSet.has(id);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ownedIds: wasOwned
          ? prev.ownedIds.filter((x) => x !== id)
          : [...prev.ownedIds, id],
      };
    });
    setJustMarked(id);
    setTimeout(() => setJustMarked(null), 600);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doflinId: id, owned: !wasOwned }),
    }).catch(console.error);

    if (!wasOwned && res && res.ok) {
      const data = await res.json().catch(() => null) as { pointsEarned?: number } | null;
      if (data?.pointsEarned && data.pointsEarned > 0) {
        toast.success(`+${data.pointsEarned} pts ganados ⭐`, {
          description: "¡Figura nueva en tu colección!",
          duration: 3500,
        });
      }
    }
  };

  const handleShareAlbum = async () => {
    if (!data) return;
    const owned = data.ownedIds.length;
    const total = data.doflins.length;
    const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
    const text = `¡Llevo ${owned}/${total} doflins (${pct}%) en mi álbum DOFLINS! 🐾`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Mi álbum DOFLINS", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link copiado");
      }
    } catch {
      /* cancelado */
    }
  };

  const grouped = useMemo<GroupedBySeries>(() => {
    if (!data) return {};
    let filtered =
      activeFilter === "ALL"
        ? data.doflins
        : data.doflins.filter((d) => d.serie === activeFilter);
    if (showMissing) filtered = filtered.filter((d) => !ownedSet.has(d.id));
    const result: GroupedBySeries = {};
    for (const d of filtered) {
      if (!result[d.serie]) result[d.serie] = {};
      if (!result[d.serie]![d.rareza]) result[d.serie]![d.rareza] = [];
      result[d.serie]![d.rareza]!.push(d);
    }
    return result;
  }, [data, activeFilter, showMissing, ownedSet]);

  if (isLoading || user === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
      </div>
    );
  }

  if (!data) return <></>;

  const totalOwned = data.ownedIds.length;
  const totalDoflins = data.doflins.length;
  const pct = totalDoflins > 0 ? Math.round((totalOwned / totalDoflins) * 100) : 0;
  const series = [...new Set(data.doflins.map((d) => d.serie))];

  return (
    <>
      <div className="space-y-8">
        {/* Album header */}
        <div className="rounded-3xl border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffdf5,#f0f8e0)] p-6 shadow-sm flex items-center gap-5 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a9050]">
              Álbum oficial
            </p>
            <h2 className="font-title mt-0.5 text-3xl font-black text-[#1a2a0a]">
              {totalOwned}
              <span className="text-xl font-semibold text-[#7a9050]">
                /{totalDoflins} stickers
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="font-title text-4xl font-black text-[#4e6f2a]">{pct}%</p>
              <p className="text-[11px] text-[#7a9050]">completado</p>
            </div>
            <button
              onClick={() => void handleShareAlbum()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4e6f2a] text-white shadow-sm hover:bg-[#3d5720] transition-colors"
              title="Compartir mi álbum"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progreso por rareza */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {RARITY_ORDER.filter((r) =>
            data.doflins.some((d) => d.rareza === r),
          ).map((r) => {
            const cfg = RARITY_CONFIG[r]!;
            const tot = data.doflins.filter((d) => d.rareza === r).length;
            const own = data.doflins.filter(
              (d) => d.rareza === r && ownedSet.has(d.id),
            ).length;
            const pctR = tot > 0 ? Math.round((own / tot) * 100) : 0;
            return (
              <div
                key={r}
                className="rounded-2xl p-3 space-y-1.5 shadow-sm"
                style={{ background: cfg.soft, border: `1px solid ${cfg.accent}` }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: cfg.color }}
                >
                  {RARITY_LABELS[r]}
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-black" style={{ color: cfg.color }}>
                    {own}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: cfg.color + "99" }}
                  >
                    /{tot}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: cfg.accent + "55" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pctR}%`, background: cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros de serie */}
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", ...series] as string[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                activeFilter === s
                  ? "bg-[#4e6f2a] text-white shadow-sm"
                  : "border border-[#d8d2b4] bg-white text-[#4a5a3a] hover:bg-[#f4f6e8]"
              }`}
            >
              {s === "ALL" ? "Todo" : s}
            </button>
          ))}
          {user ? (
            <button
              onClick={() => setShowMissing((v) => !v)}
              className={`ml-auto rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                showMissing
                  ? "bg-amber-500 text-white shadow-sm"
                  : "border border-[#d8d2b4] bg-white text-[#4a5a3a] hover:bg-[#f4f6e8]"
              }`}
            >
              {showMissing ? "✓ Solo me faltan" : "Solo me faltan"}
            </button>
          ) : null}
          {!user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="ml-auto flex items-center gap-1.5 rounded-full border border-[#4e6f2a]/30 bg-[#eaf5d8] px-4 py-1.5 text-xs font-semibold text-[#4e6f2a] hover:bg-[#d8f0b4] transition-colors"
            >
              <SparklesIcon className="h-3 w-3" /> Inicia sesión para marcar
            </button>
          ) : null}
        </div>

        {/* Álbum por sección */}
        {Object.entries(grouped).map(([serie, byRarity]) => (
          <AlbumSection
            key={serie}
            serie={serie}
            byRarity={byRarity}
            ownedSet={ownedSet}
            justMarked={justMarked}
            onSticker={handleSticker}
          />
        ))}
      </div>

      {isAuthModalOpen ? (
        <UserAuthModal onClose={() => setIsAuthModalOpen(false)} />
      ) : null}
    </>
  );
}

// ─── Sección por serie ────────────────────────────────────────────────────────

function AlbumSection({
  serie,
  byRarity,
  ownedSet,
  justMarked,
  onSticker,
}: {
  serie: string;
  byRarity: Record<string, DoflinRow[]>;
  ownedSet: Set<number>;
  justMarked: number | null;
  onSticker: (id: number) => Promise<void>;
}) {
  const serieColor = serie === "Multiverse" ? "#3040a0" : "#4e6f2a";
  const serieSoft = serie === "Multiverse" ? "#e8ecff" : "#eaf5d8";

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 rounded-2xl px-5 py-3"
        style={{ background: serieSoft, border: `1.5px solid ${serieColor}33` }}
      >
        <div className="h-1 flex-1 rounded-full" style={{ background: `${serieColor}33` }} />
        <h3
          className="font-title text-lg font-black uppercase tracking-[0.15em]"
          style={{ color: serieColor }}
        >
          {serie}
        </h3>
        <div className="h-1 flex-1 rounded-full" style={{ background: `${serieColor}33` }} />
      </div>

      {RARITY_ORDER.filter((r) => byRarity[r]?.length).map((rarity) => {
        const cfg = RARITY_CONFIG[rarity]!;
        const items = byRarity[rarity]!;
        const ownedCount = items.filter((d) => ownedSet.has(d.id)).length;

        return (
          <div key={rarity} className="space-y-2">
            <div className="flex items-center gap-2 px-0.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: cfg.color }}
              />
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: cfg.color }}
              >
                {RARITY_LABELS[rarity]} · {ownedCount}/{items.length}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {items.map((d, stickerIndex) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.25, delay: Math.min(stickerIndex, 10) * 0.03, ease: "easeOut" }}
                >
                <StickerCard
                  doflin={d}
                  owned={ownedSet.has(d.id)}
                  isNew={justMarked === d.id}
                  rarityConfig={cfg}
                  onPress={() => void onSticker(d.id)}
                />
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sticker card ─────────────────────────────────────────────────────────────

function StickerCard({
  doflin,
  owned,
  isNew,
  rarityConfig,
  onPress,
}: {
  doflin: DoflinRow;
  owned: boolean;
  isNew: boolean;
  rarityConfig: { color: string; soft: string; accent: string };
  onPress: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileHover={{ y: -4, scale: 1.06, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.93, transition: { duration: 0.1 } }}
      className={`group relative flex flex-col overflow-hidden rounded-xl text-left ${
        isNew ? "scale-110" : ""
      } ${!owned ? "opacity-55 hover:opacity-80" : ""}`}
      style={{
        background: owned
          ? `linear-gradient(145deg,${rarityConfig.soft},white)`
          : "#f0ede6",
        border: owned
          ? `2px solid ${rarityConfig.accent}`
          : "2px solid #d8d2b4",
      }}
    >
      {/* Número */}
      <div
        className="absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black leading-none"
        style={{
          background: owned ? rarityConfig.color : "#b0a888",
          color: "white",
        }}
      >
        {doflin.numeroColeccion}
      </div>

      {/* Imagen */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "1/1",
          background: owned ? rarityConfig.soft : "#e8e5de",
        }}
      >
        {owned ? (
          <Image
            src={doflin.imagenUrl}
            alt={doflin.nombre}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <>
            <Image
              src={doflin.siluetaUrl || doflin.imagenUrl}
              alt={`#${doflin.numeroColeccion}`}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-contain p-1.5 opacity-20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <LockClosedIcon className="h-6 w-6 text-[#b0a888]" />
            </div>
          </>
        )}
        {owned ? (
          <div
            className="absolute bottom-0.5 right-0.5 rounded-full p-0.5"
            style={{ background: rarityConfig.color }}
          >
            <CheckCircleIcon className="h-3 w-3 text-white" />
          </div>
        ) : null}
      </div>

      {/* Nombre */}
      <div className="px-1.5 py-1">
        <p
          className={`truncate text-[10px] font-semibold leading-tight ${
            owned ? "text-[var(--ink-900)]" : "text-[var(--ink-400)]"
          }`}
        >
          {owned ? doflin.nombre : `#${String(doflin.numeroColeccion).padStart(2, "0")}`}
        </p>
      </div>
    </motion.button>
  );
}
