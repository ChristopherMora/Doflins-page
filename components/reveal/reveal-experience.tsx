"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  BoltIcon,
  CheckCircleIcon,
  CubeIcon,
  FireIcon,
  FunnelIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TicketIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";

import { pushDataLayerEvent } from "@/lib/analytics";
import { RARITY_CONFIG, RARITY_ORDER, rarityLabel } from "@/lib/constants/rarity";
import type { CollectionItemDTO, Rarity } from "@/lib/types/doflin";
import { Figure3D } from "@/components/reveal/figure-3d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

const FALLBACK_DOFLIN_IMAGE = "/images/placeholders/doflin-placeholder.svg";
const ACTIVE_SERIES = ["Animals", "Multiverse"] as const;

type Universe = "animals" | "multiverse";
type RarityFilter = "all" | Rarity;

interface CollectionPayload {
  status: "ok";
  collection: CollectionItemDTO[];
}

interface RemainingPayload {
  status: "ok";
  remaining: Record<Rarity, number>;
  totalRemaining: number;
}

interface PackOption {
  name: string;
  pieces: number;
  detail: string;
  icon: React.ElementType;
  cardClassName: string;
}

const ANIMALS_PACKS: PackOption[] = [
  {
    name: "Explorador",
    pieces: 5,
    detail: "Entrada rápida a la colección Animals",
    icon: MapIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#eef4d9,#deecbe,#c9de9f)] shadow-[0_18px_34px_rgba(98,121,58,0.2)]",
  },
  {
    name: "Safari",
    pieces: 15,
    detail: "Balance ideal entre variedad y costo",
    icon: GlobeAltIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#ffeccf,#ffdcae,#f6c889)] shadow-[0_18px_34px_rgba(170,112,37,0.2)]",
  },
  {
    name: "Salvaje",
    pieces: 30,
    detail: "La experiencia más completa de fauna",
    icon: FireIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#ffe2cf,#ffc79e,#f49b6d)] shadow-[0_18px_34px_rgba(172,83,42,0.24)]",
  },
];

const MULTIVERSE_PACKS: PackOption[] = [
  {
    name: "Portal",
    pieces: 5,
    detail: "Primer salto a variantes de Multiverse",
    icon: RocketLaunchIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#e9f3ff,#d7e8ff,#c4dbff)] shadow-[0_18px_34px_rgba(58,92,156,0.2)]",
  },
  {
    name: "Nexo",
    pieces: 15,
    detail: "Más posibilidades de rarezas altas",
    icon: SparklesIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#e6ecff,#d7ddff,#c7ccff)] shadow-[0_18px_34px_rgba(77,82,164,0.22)]",
  },
  {
    name: "Omniverse",
    pieces: 30,
    detail: "Pack premium para cazar épicos y más",
    icon: BoltIcon,
    cardClassName:
      "bg-[linear-gradient(135deg,#f0e9ff,#e2d7ff,#d3c6ff)] shadow-[0_18px_34px_rgba(104,76,158,0.22)]",
  },
];

const RARITY_FILTER_OPTIONS: { value: RarityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...RARITY_ORDER.map((rarity) => ({ value: rarity, label: rarityLabel(rarity) })),
];

function RarityPill({ rarity }: { rarity: Rarity }): React.JSX.Element {
  const config = RARITY_CONFIG[rarity];

  return (
    <Badge
      className="font-bold"
      style={{
        backgroundColor: config.softColor,
        color: rarity === "MYTHIC" ? "#4A3A18" : config.color,
      }}
    >
      {rarityLabel(rarity)}
    </Badge>
  );
}

function normalizeSeries(series: string): string {
  return series.trim().toLowerCase();
}

export function RevealExperience(): React.JSX.Element {
  const [activeUniverse, setActiveUniverse] = useState<Universe>("animals");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [collection, setCollection] = useState<CollectionItemDTO[]>([]);
  const [remaining, setRemaining] = useState<Record<Rarity, number> | null>(null);

  const featuredCollection = useMemo(() => {
    const subset = collection.filter((item) =>
      ACTIVE_SERIES.some((seriesName) => normalizeSeries(seriesName) === normalizeSeries(item.series)),
    );

    return subset.length ? subset : collection;
  }, [collection]);

  const animalsCollection = useMemo(
    () => featuredCollection.filter((item) => normalizeSeries(item.series) === "animals"),
    [featuredCollection],
  );

  const multiverseCollection = useMemo(
    () => featuredCollection.filter((item) => normalizeSeries(item.series) === "multiverse"),
    [featuredCollection],
  );

  const collectionCounts = useMemo(
    () => ({
      animals: animalsCollection.length,
      multiverse: multiverseCollection.length,
    }),
    [animalsCollection.length, multiverseCollection.length],
  );

  const filteredCollection = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return featuredCollection
      .filter((item) => {
        if (rarityFilter !== "all" && item.rarity !== rarityFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const byName = item.name.toLowerCase().includes(normalizedSearch);
        const bySeries = item.series.toLowerCase().includes(normalizedSearch);
        const byNumber = String(item.collectionNumber).includes(normalizedSearch);

        return byName || bySeries || byNumber;
      })
      .sort((a, b) => a.collectionNumber - b.collectionNumber);
  }, [featuredCollection, rarityFilter, searchQuery]);

  const animalsFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "animals"),
    [filteredCollection],
  );

  const multiverseFiltered = useMemo(
    () => filteredCollection.filter((item) => normalizeSeries(item.series) === "multiverse"),
    [filteredCollection],
  );

  const activeConfig = useMemo(
    () =>
      activeUniverse === "animals"
        ? {
            label: "Animals",
            sectionTitle: "Sección Doflins Animals",
            packs: ANIMALS_PACKS,
            cards: animalsFiltered,
            count: collectionCounts.animals,
            badgeClass: "bg-[#edf4d8] text-[var(--ink-800)] ring-1 ring-[#c9da9a]",
            cardClass: "border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)]",
            buttonClass: "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]",
          }
        : {
            label: "Multiverse",
            sectionTitle: "Sección Doflins Multiverse",
            packs: MULTIVERSE_PACKS,
            cards: multiverseFiltered,
            count: collectionCounts.multiverse,
            badgeClass: "bg-[#e9efff] text-[var(--ink-800)] ring-1 ring-[#c8d3f4]",
            cardClass: "border-[#ccd2e8] bg-[linear-gradient(180deg,#eff3ff,#e4e9fb)]",
            buttonClass: "bg-[linear-gradient(135deg,#4a62b5,#5d74cf)]",
          },
    [activeUniverse, animalsFiltered, collectionCounts.animals, collectionCounts.multiverse, multiverseFiltered],
  );

  const scrollToSection = useCallback(
    (sectionId: "universos" | "universo-activo" | "rareza" | "catalogo" | "plataforma") => {
      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  const openUniverse = useCallback(
    (target: Universe, sectionId: "universo-activo" | "catalogo") => {
      setActiveUniverse(target);
      scrollToSection(sectionId);
    },
    [scrollToSection],
  );

  useEffect(() => {
    async function loadCatalogData(): Promise<void> {
      try {
        const [collectionResponse, statsResponse] = await Promise.all([
          fetch("/api/collection", { cache: "no-store" }),
          fetch("/api/stats/remaining", { cache: "no-store" }),
        ]);

        if (collectionResponse.ok) {
          const collectionPayload = (await collectionResponse.json()) as CollectionPayload;
          setCollection(collectionPayload.collection);
        }

        if (statsResponse.ok) {
          const statsPayload = (await statsResponse.json()) as RemainingPayload;
          setRemaining(statsPayload.remaining);
        }
      } catch {
        setCollection([]);
      }
    }

    void loadCatalogData();
  }, []);

  const purchaseUrl = process.env.NEXT_PUBLIC_WOO_PRODUCT_URL ?? "https://dofer.com.mx";
  const tikTokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com";

  const handlePurchaseIntent = useCallback(() => {
    toast("Abriendo compra...", {
      description: "Elige tu universo y continúa con tu colección.",
      icon: <ShoppingCartIcon className="h-4 w-4" />,
    });

    pushDataLayerEvent("PurchaseIntent", {
      source: "catalog_cta",
      eventAlias: "purchase_intent",
    });

    void fetch("/api/events/purchase-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "catalog_cta",
      }),
      keepalive: true,
    }).catch(() => null);
  }, []);

  return (
    <main className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_10%_8%,rgba(246,192,93,0.32),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(70,130,180,0.3),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(87,116,56,0.2),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f9f5e7,#e8f0df_42%,#d8e4da)]" />

      <header className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-5 pt-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between rounded-full border border-[#efe2bf]/85 bg-[#fff8e7]/90 px-3 py-2 shadow-[0_10px_26px_rgba(86,89,39,0.18)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#425f2d,#6f8740)] text-sm font-black text-white">
              DF
            </div>
            <p className="font-title text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">DOFLINS</p>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--ink-700)] lg:flex">
            <button type="button" onClick={() => scrollToSection("universos")} className="transition hover:text-[var(--brand-primary)]">
              Universos
            </button>
            <button type="button" onClick={() => scrollToSection("rareza")} className="transition hover:text-[var(--brand-primary)]">
              Rareza
            </button>
            <button type="button" onClick={() => scrollToSection("catalogo")} className="transition hover:text-[var(--brand-primary)]">
              Catálogo
            </button>
            <button type="button" onClick={() => scrollToSection("plataforma")} className="transition hover:text-[var(--brand-primary)]">
              Plataforma
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <a href={purchaseUrl} target="_blank" rel="noreferrer" className="hidden sm:block" onClick={handlePurchaseIntent}>
              <Button className="h-11 bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-6 text-white hover:brightness-105">Comprar</Button>
            </a>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="h-10 w-10 rounded-full p-0 lg:hidden">
                  <Bars3Icon className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[var(--surface-100)]">
                <SheetHeader>
                  <SheetTitle>DOFLINS</SheetTitle>
                  <SheetDescription>Navegación rápida</SheetDescription>
                </SheetHeader>
                <div className="space-y-2">
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("universos")}>
                      Universos
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => openUniverse("animals", "universo-activo")}>
                      Animals
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => openUniverse("multiverse", "universo-activo")}>
                      Multiverse
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("catalogo")}>
                      Catálogo
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div className="space-y-6">
            <Badge className="border-[#e4d6af] bg-[#fff9ea] text-[var(--ink-700)] ring-1 ring-[#d6c79b]">Ediciones oficiales 2026</Badge>
            <h1 className="font-title text-5xl leading-[0.95] tracking-tight text-[var(--ink-900)] sm:text-6xl">
              Animals y Multiverse
              <br />
              2 personalidades distintas
            </h1>
            <p className="max-w-2xl text-[1.15rem] leading-relaxed text-[var(--ink-700)]">
              Selecciona el universo activo para ver solo esa temática. Cada colección mantiene su propia personalidad
              visual sin mezclarse en la misma vista.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-12 bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" onClick={() => scrollToSection("universos")}>
                <SparklesIcon className="h-5 w-5" /> Explorar universos
              </Button>
              <a href={purchaseUrl} target="_blank" rel="noreferrer" onClick={handlePurchaseIntent}>
                <Button variant="secondary" size="lg" className="h-12">
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar mystery bag
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-[var(--ink-700)]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e6d9b4] bg-[#fff8e8] px-3 py-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-700" /> QR oficial verificado
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e6d9b4] bg-[#fff8e8] px-3 py-1.5">
                <CubeIcon className="h-4 w-4 text-lime-700" /> Catálogo 3D por figura
              </span>
            </div>
          </div>

          <Card className="overflow-hidden border-[#e8dcb8]/80 bg-[#fff9ea]/90 shadow-[0_18px_45px_rgba(89,79,30,0.18)]">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Estado de colección</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#edf4d9,#d8eaaf)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Animals</p>
                  <p className="mt-1 text-3xl font-black text-[var(--ink-900)]">{collectionCounts.animals}</p>
                  <p className="text-xs text-[var(--ink-700)]">modelos activos</p>
                </div>
                <div className="rounded-2xl bg-[linear-gradient(135deg,#e8efff,#d3e0ff)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">Multiverse</p>
                  <p className="mt-1 text-3xl font-black text-[var(--ink-900)]">{collectionCounts.multiverse}</p>
                  <p className="text-xs text-[var(--ink-700)]">modelos activos</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/90 p-4 text-sm text-[var(--ink-700)]">
                <p className="flex items-center gap-2 font-semibold text-[var(--ink-900)]">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-700" /> Plataforma conectada
                </p>
                <p className="mt-1">Datos cargados desde `/api/collection` y `/api/stats/remaining`.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10" id="universos">
        <h2 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Universos DOFLINS</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#f0f5dd,#dceab8,#c9de9f)] shadow-[0_18px_34px_rgba(85,117,54,0.2)]">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">Sección</p>
              <h3 className="font-title text-3xl text-[var(--ink-900)]">Doflins Animals</h3>
              <p className="text-[var(--ink-700)]">Fauna con personalidad, colores naturales y look safari/selva.</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white text-[var(--ink-900)]">{collectionCounts.animals} modelos</Badge>
                <Badge className="bg-white text-[var(--ink-900)]">Explorador / Safari / Salvaje</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openUniverse("animals", "universo-activo")}>Activar Animals</Button>
                <Button variant="secondary" size="sm" onClick={() => openUniverse("animals", "catalogo")}>Ver catálogo Animals</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#e9efff,#d8e3ff,#c8d4ff)] shadow-[0_18px_34px_rgba(62,88,152,0.24)]">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">Sección</p>
              <h3 className="font-title text-3xl text-[var(--ink-900)]">Doflins Multiverse</h3>
              <p className="text-[var(--ink-700)]">Versiones alternas con estética futurista y rarezas de alto impacto.</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white text-[var(--ink-900)]">{collectionCounts.multiverse} modelos</Badge>
                <Badge className="bg-white text-[var(--ink-900)]">Portal / Nexo / Omniverse</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-[linear-gradient(135deg,#4a62b5,#5d74cf)]" onClick={() => openUniverse("multiverse", "universo-activo")}>Activar Multiverse</Button>
                <Button variant="secondary" size="sm" onClick={() => openUniverse("multiverse", "catalogo")}>Ver catálogo Multiverse</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="universo-activo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">{activeConfig.sectionTitle}</h3>
          <Badge className={activeConfig.badgeClass}>{activeConfig.count} figuras</Badge>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <Button size="sm" className={activeUniverse === "animals" ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : undefined} variant={activeUniverse === "animals" ? "primary" : "secondary"} onClick={() => setActiveUniverse("animals")}>
            Ver Animals
          </Button>
          <Button size="sm" className={activeUniverse === "multiverse" ? "bg-[linear-gradient(135deg,#4a62b5,#5d74cf)]" : undefined} variant={activeUniverse === "multiverse" ? "primary" : "secondary"} onClick={() => setActiveUniverse("multiverse")}>
            Ver Multiverse
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {activeConfig.packs.map((pack) => {
            const Icon = pack.icon;

            return (
              <Card key={pack.name} className={`overflow-hidden border-0 ${pack.cardClassName}`}>
                <CardContent className="space-y-2 p-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-title text-2xl text-[var(--ink-900)]">{pack.name}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[var(--ink-900)]">
                      <Icon className="h-4 w-4" /> {pack.pieces}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--ink-700)]">{pack.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10" id="rareza">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Sistema de rareza</h3>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7df] px-4 py-2 text-sm text-[var(--ink-700)] ring-1 ring-[#d3c18f]">
            <FireIcon className="h-4 w-4 text-orange-600" />
            Quedan {remaining?.LEGENDARY ?? "--"} legendarios sin descubrir
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RARITY_ORDER.map((rarity) => (
            <Card key={rarity} className="border-[#e8dab4] bg-[#fff9e8]/88">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-title text-xl text-[var(--ink-900)]">{rarityLabel(rarity)}</h4>
                  <span
                    className="rounded-full px-2 py-1 text-xs font-bold"
                    style={{ color: RARITY_CONFIG[rarity].color, backgroundColor: RARITY_CONFIG[rarity].softColor }}
                  >
                    {RARITY_CONFIG[rarity].probability}%
                  </span>
                </div>
                <p className="text-sm text-[var(--ink-700)]">{RARITY_CONFIG[rarity].description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="catalogo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Catálogo de {activeConfig.label}</h3>
          <Badge className={activeConfig.badgeClass}>{activeConfig.cards.length} figuras visibles</Badge>
        </div>

        <Card className="border-[#e7dab8] bg-[#fff9ea]/90">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className={activeUniverse === "animals" ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : undefined}
                variant={activeUniverse === "animals" ? "primary" : "secondary"}
                onClick={() => setActiveUniverse("animals")}
              >
                Mostrar Animals
              </Button>
              <Button
                size="sm"
                className={activeUniverse === "multiverse" ? "bg-[linear-gradient(135deg,#4a62b5,#5d74cf)]" : undefined}
                variant={activeUniverse === "multiverse" ? "primary" : "secondary"}
                onClick={() => setActiveUniverse("multiverse")}
              >
                Mostrar Multiverse
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-600)]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nombre, serie o número"
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
                <FunnelIcon className="h-4 w-4" /> Rareza
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {RARITY_FILTER_OPTIONS.map((option) => {
                const isActive = rarityFilter === option.value;

                return (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className={isActive ? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]" : undefined}
                    onClick={() => setRarityFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {activeConfig.cards.map((item) => (
            <Card key={item.id} className={`overflow-hidden border ${activeConfig.cardClass}`}>
              <CardContent className="space-y-3 p-3">
                <Figure3D
                  src={item.imageUrl}
                  fallbackSrc={FALLBACK_DOFLIN_IMAGE}
                  alt={item.name}
                  rarity={item.rarity}
                  imageClassName="h-[145px]"
                  className="p-2"
                  modelUrl={item.collectionNumber === 1 ? "/models/doflins/michael-myers-multicolor.glb?v=5" : undefined}
                  modelOrientation={item.collectionNumber === 1 ? "90deg 0deg 0deg" : undefined}
                />

                <div className="space-y-1">
                  <p className="truncate font-semibold text-[var(--ink-900)]">{item.name}</p>
                  <p className="text-xs text-[var(--ink-600)]">{item.series}</p>
                  <p className="text-xs text-[var(--ink-600)]">#{String(item.collectionNumber).padStart(2, "0")}</p>
                  <RarityPill rarity={item.rarity} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeConfig.cards.length === 0 ? (
          <Card className="mt-5 border-[#e7dab8] bg-[#fff9ea]/90">
            <CardContent className="p-6 text-center">
              <p className="font-semibold text-[var(--ink-900)]">No encontramos figuras con ese filtro.</p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">Prueba otra búsqueda o quita filtros de rareza.</p>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10" id="plataforma">
        <h3 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Plataforma y experiencia de usuario</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#dccc99] bg-[#fff8e7]/90">
            <CardContent className="space-y-2 p-5">
              <CubeIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">API en vivo</p>
              <p className="text-sm text-[var(--ink-700)]">Colección y stats cargan en tiempo real desde backend.</p>
            </CardContent>
          </Card>
          <Card className="border-[#dccc99] bg-[#fff8e7]/90">
            <CardContent className="space-y-2 p-5">
              <InformationCircleIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">2 personalidades</p>
              <p className="text-sm text-[var(--ink-700)]">Cada universo se visualiza por separado con selector activo.</p>
            </CardContent>
          </Card>
          <Card className="border-[#dccc99] bg-[#fff8e7]/90">
            <CardContent className="space-y-2 p-5">
              <TicketIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Tracking de compra</p>
              <p className="text-sm text-[var(--ink-700)]">CTA registra `purchase_intent` para medir conversión.</p>
            </CardContent>
          </Card>
          <Card className="border-[#dccc99] bg-[#fff8e7]/90">
            <CardContent className="space-y-2 p-5">
              <SparklesIcon className="h-6 w-6 text-[var(--brand-primary)]" />
              <p className="font-semibold text-[var(--ink-900)]">Catálogo utilizable</p>
              <p className="text-sm text-[var(--ink-700)]">Búsqueda + rareza sin mezclar universos en pantalla.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-5xl px-5 sm:px-8 lg:px-10">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#3f5a27,#4f6a6f,#5f6cc1)] text-white shadow-[0_25px_50px_rgba(49,67,58,0.45)]">
          <CardContent className="space-y-5 p-8 text-center sm:p-10">
            <p className="text-sm uppercase tracking-[0.24em] text-white/80">Siguiente paso</p>
            <h3 className="font-title text-3xl sm:text-4xl">Colecciona Animals y Multiverse</h3>
            <p className="mx-auto max-w-2xl text-white/85">Selecciona tu universo favorito o combínalos para completar todo el catálogo.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={purchaseUrl} target="_blank" rel="noreferrer" onClick={handlePurchaseIntent}>
                <Button className="bg-white text-[#31481e] hover:bg-slate-100" size="lg">
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar ahora
                </Button>
              </a>
              <Link href="#catalogo">
                <Button variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                  <TicketIcon className="h-5 w-5" /> Ver catálogo
                </Button>
              </Link>
              <a href={tikTokUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                  <BoltIcon className="h-5 w-5" /> Síguenos en TikTok
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <Toaster />
    </main>
  );
}
