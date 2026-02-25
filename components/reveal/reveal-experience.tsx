"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  BoltIcon,
  CheckCircleIcon,
  CubeIcon,
  FireIcon,
  InformationCircleIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FALLBACK_DOFLIN_IMAGE = "/images/placeholders/doflin-placeholder.svg";
const ACTIVE_SERIES = ["Animals", "Multiverse"] as const;

type SeriesFilter = "all" | "animals" | "multiverse";

interface CollectionPayload {
  status: "ok";
  collection: CollectionItemDTO[];
}

interface RemainingPayload {
  status: "ok";
  remaining: Record<Rarity, number>;
  totalRemaining: number;
}

function RarityPill({ rarity }: { rarity: Rarity }): React.JSX.Element {
  const config = RARITY_CONFIG[rarity];

  return (
    <Badge
      className="font-bold"
      style={{
        backgroundColor: config.softColor,
        color: rarity === "MYTHIC" ? "#7C5A10" : config.color,
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
  const [seriesFilter, setSeriesFilter] = useState<SeriesFilter>("all");
  const [collection, setCollection] = useState<CollectionItemDTO[]>([]);
  const [remaining, setRemaining] = useState<Record<Rarity, number> | null>(null);

  const featuredCollection = useMemo(() => {
    const subset = collection.filter((item) =>
      ACTIVE_SERIES.some((seriesName) => normalizeSeries(seriesName) === normalizeSeries(item.series)),
    );

    return subset.length ? subset : collection;
  }, [collection]);

  const collectionCounts = useMemo(
    () => ({
      animals: featuredCollection.filter((item) => normalizeSeries(item.series) === "animals").length,
      multiverse: featuredCollection.filter((item) => normalizeSeries(item.series) === "multiverse").length,
    }),
    [featuredCollection],
  );

  const filteredCollection = useMemo(() => {
    if (seriesFilter === "all") {
      return featuredCollection;
    }

    const target = seriesFilter === "animals" ? "animals" : "multiverse";
    return featuredCollection.filter((item) => normalizeSeries(item.series) === target);
  }, [featuredCollection, seriesFilter]);

  const scrollToSection = useCallback((sectionId: "rareza" | "colecciones" | "coleccion" | "como-funciona") => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
      description: "Elige tu pack x1, x3 o x5 para seguir coleccionando.",
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
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_8%,rgba(123,97,255,0.35),transparent_36%),radial-gradient(circle_at_86%_12%,rgba(76,145,255,0.26),transparent_36%),radial-gradient(circle_at_50%_88%,rgba(255,125,212,0.2),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f6f3ff,#f2f6ff_45%,#f8f4ff)]" />

      <header className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-[0_12px_36px_rgba(63,41,128,0.12)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#2d1a62,#5133be)] text-sm font-black text-white">
              DF
            </div>
            <p className="font-title text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">DOFLINS</p>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[var(--ink-700)] lg:flex">
            <button type="button" onClick={() => scrollToSection("colecciones")} className="transition hover:text-[var(--brand-primary)]">
              Ediciones
            </button>
            <button type="button" onClick={() => scrollToSection("como-funciona")} className="transition hover:text-[var(--brand-primary)]">
              Cómo funciona
            </button>
            <button type="button" onClick={() => scrollToSection("coleccion")} className="transition hover:text-[var(--brand-primary)]">
              Catálogo
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <a href={purchaseUrl} target="_blank" rel="noreferrer" className="hidden sm:block" onClick={handlePurchaseIntent}>
              <Button className="h-11 bg-[linear-gradient(135deg,#6636ff,#7a4bff)] px-6 text-white hover:brightness-105">Comprar mystery bag</Button>
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
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("como-funciona")}>
                      Cómo funciona
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("rareza")}>
                      Rareza
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => scrollToSection("coleccion")}>
                      Catálogo
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 pt-9 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <div className="space-y-6">
            <Badge className="border-white/80 bg-white/75 text-[var(--ink-700)] ring-1 ring-black/10">QR fijo oficial de catálogo</Badge>
            <h1 className="font-title text-5xl leading-[0.95] tracking-tight text-[var(--ink-900)] sm:text-6xl">
              Colecciona los
              <br />
              DOFLINS
            </h1>
            <p className="max-w-2xl text-[1.30rem] leading-relaxed text-[var(--ink-700)]">
              Este QR lleva a la página oficial de rarezas y colección completa. No necesitas ingresar código: solo
              revisa rarezas, modelos y elige tu siguiente pack.
            </p>

            <div className="flex flex-wrap gap-3">
              <a href={purchaseUrl} target="_blank" rel="noreferrer" onClick={handlePurchaseIntent}>
                <Button size="lg" className="h-12 bg-[linear-gradient(135deg,#6636ff,#7a4bff)]">
                  <SparklesIcon className="h-5 w-5" /> Comprar mystery bag
                </Button>
              </a>

              <Button variant="secondary" size="lg" className="h-12" onClick={() => scrollToSection("coleccion")}>
                <TicketIcon className="h-5 w-5" /> Ver colección completa
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-sm text-[var(--ink-700)]">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/90 bg-white/75 px-3 py-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-600" /> Página oficial verificada
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/90 bg-white/75 px-3 py-1.5">
                <CubeIcon className="h-4 w-4 text-violet-600" /> Figuras con efecto 3D visual
              </span>
            </div>
          </div>

          <Card className="overflow-hidden border-white/80 bg-white/78 shadow-[0_18px_50px_rgba(65,46,132,0.18)]">
            <CardContent className="space-y-4 p-6">
              <Tabs defaultValue="rareza">
                <TabsList className="grid h-11 w-full grid-cols-3">
                  <TabsTrigger value="rareza">Rareza</TabsTrigger>
                  <TabsTrigger value="valor">Valor</TabsTrigger>
                  <TabsTrigger value="tips">Tips</TabsTrigger>
                </TabsList>

                <TabsContent value="rareza" className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Probabilidades oficiales</p>
                  <ul className="space-y-2">
                    {RARITY_ORDER.map((rarity) => (
                      <li key={rarity} className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-2">
                        <span className="font-semibold text-[var(--ink-800)]">{rarityLabel(rarity)}</span>
                        <span className="text-sm font-bold" style={{ color: RARITY_CONFIG[rarity].color }}>
                          {RARITY_CONFIG[rarity].probability}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="valor" className="space-y-3 text-sm text-[var(--ink-700)]">
                  <div className="rounded-2xl bg-white/90 p-4">
                    <p className="flex items-center gap-2 font-semibold text-[var(--ink-800)]">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-600" /> Más confianza para el cliente
                    </p>
                    <p className="mt-1">QR único para todos: simple de operar y sin errores manuales en empaque.</p>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-4">
                    <p className="flex items-center gap-2 font-semibold text-[var(--ink-800)]">
                      <InformationCircleIcon className="h-4 w-4 text-sky-600" /> Colecciones activas
                    </p>
                    <p className="mt-1">Muestra clara de Animals y Multiverse con rareza visible por personaje.</p>
                  </div>
                </TabsContent>

                <TabsContent value="tips" className="space-y-3 text-sm text-[var(--ink-700)]">
                  <p className="rounded-2xl bg-white/90 px-4 py-3">Manda directo a compra con botón visible arriba y abajo.</p>
                  <p className="rounded-2xl bg-white/90 px-4 py-3">Destaca cuántos legendarios/míticos siguen sin descubrirse.</p>
                  <p className="rounded-2xl bg-white/90 px-4 py-3">Invita a compartir resultados en TikTok para aumentar alcance.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-8 lg:px-10" id="como-funciona">
        <Card className="overflow-hidden border-white/90 bg-white/82 shadow-[0_22px_45px_rgba(69,48,138,0.14)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <h2 className="font-title text-3xl text-[var(--ink-900)]">Cómo funciona ahora</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[linear-gradient(135deg,#efe9ff,#e2d7ff)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Paso 1</p>
                <p className="mt-2 font-semibold text-[var(--ink-900)]">Compra tu bolsa</p>
                <p className="mt-1 text-sm text-[var(--ink-700)]">Pack x1, x3 o x5 según tu producto.</p>
              </div>
              <div className="rounded-2xl bg-[linear-gradient(135deg,#e4ecff,#d4e3ff)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Paso 2</p>
                <p className="mt-2 font-semibold text-[var(--ink-900)]">Escanea el QR fijo</p>
                <p className="mt-1 text-sm text-[var(--ink-700)]">Te lleva a esta página oficial de rareza y catálogo.</p>
              </div>
              <div className="rounded-2xl bg-[linear-gradient(135deg,#ffe8ef,#ffd9e9)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Paso 3</p>
                <p className="mt-2 font-semibold text-[var(--ink-900)]">Compara y comparte</p>
                <p className="mt-1 text-sm text-[var(--ink-700)]">Revisa rarezas y comparte en TikTok.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 p-4">
              <p className="text-sm font-semibold text-[var(--ink-900)]">Texto recomendado para imprimir en cada bolsita:</p>
              <p className="mt-2 rounded-xl bg-white p-3 text-sm text-[var(--ink-800)]">
                &ldquo;Escanea este QR para ver la colección oficial DOFLINS, conocer niveles de rareza (Común, Raro,
                Épico, Legendario, Ultra, Mítico) y descubrir nuevas ediciones.&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10" id="rareza">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Sistema de rareza</h3>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[var(--ink-700)] ring-1 ring-black/10">
            <FireIcon className="h-4 w-4 text-orange-500" />
            Quedan {remaining?.LEGENDARY ?? "--"} legendarios sin descubrir
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RARITY_ORDER.map((rarity) => (
            <Card key={rarity} className="border-white bg-white/80">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-title text-xl text-[var(--ink-900)]">{rarityLabel(rarity)}</h4>
                  <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ color: RARITY_CONFIG[rarity].color, backgroundColor: RARITY_CONFIG[rarity].softColor }}>
                    {RARITY_CONFIG[rarity].probability}%
                  </span>
                </div>
                <p className="text-sm text-[var(--ink-700)]">{RARITY_CONFIG[rarity].description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="colecciones">
        <h3 className="mb-5 font-title text-3xl text-[var(--ink-900)]">Colecciones activas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#ffe5d0,#ffd4bd,#ffbe95)] shadow-[0_18px_34px_rgba(191,108,25,0.2)]">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">Colección</p>
              <h4 className="font-title text-3xl text-[var(--ink-900)]">Animals</h4>
              <p className="text-[var(--ink-700)]">Personajes inspirados en fauna con acabados de colección.</p>
              <Badge className="bg-white text-[var(--ink-900)]">{collectionCounts.animals} modelos</Badge>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#d9dbff,#c7cbff,#b3bbff)] shadow-[0_18px_34px_rgba(64,76,188,0.24)]">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-700)]">Colección</p>
              <h4 className="font-title text-3xl text-[var(--ink-900)]">Multiverse</h4>
              <p className="text-[var(--ink-700)]">Versiones alternas y temáticas especiales con rarezas altas.</p>
              <Badge className="bg-white text-[var(--ink-900)]">{collectionCounts.multiverse} modelos</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10" id="coleccion">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-title text-3xl text-[var(--ink-900)]">Colección completa</h3>
          <Badge className="bg-white text-[var(--ink-700)] ring-1 ring-black/10">{filteredCollection.length} figuras visibles</Badge>
        </div>

        <Tabs value={seriesFilter} onValueChange={(value) => setSeriesFilter(value as SeriesFilter)}>
          <TabsList className="mb-5 grid h-11 w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="animals">Animals</TabsTrigger>
            <TabsTrigger value="multiverse">Multiverse</TabsTrigger>
          </TabsList>

          <TabsContent value={seriesFilter} className="mt-0">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredCollection.map((item) => (
                <Card key={item.id} className="overflow-hidden border-white bg-white/82">
                  <CardContent className="space-y-3 p-3">
                    <Figure3D
                      src={item.imageUrl}
                      fallbackSrc={FALLBACK_DOFLIN_IMAGE}
                      alt={item.name}
                      rarity={item.rarity}
                      imageClassName="h-[145px]"
                      className="p-2"
                      modelUrl={
                        item.collectionNumber === 1
                          ? "/models/doflins/michael-myers-multicolor.glb?v=5"
                          : undefined
                      }
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
          </TabsContent>
        </Tabs>
      </section>

      <section className="mx-auto mt-8 w-full max-w-5xl px-5 sm:px-8 lg:px-10">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#2d1a62,#4a2da8,#6b3fff)] text-white shadow-[0_25px_50px_rgba(53,34,116,0.45)]">
          <CardContent className="space-y-5 p-8 text-center sm:p-10">
            <p className="text-sm uppercase tracking-[0.24em] text-white/80">Siguiente paso</p>
            <h3 className="font-title text-3xl sm:text-4xl">¿Quieres completar la colección?</h3>
            <p className="mx-auto max-w-2xl text-white/85">Compra otra bolsa y aumenta tus probabilidades. Elige pack x1, x3 o x5.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={purchaseUrl} target="_blank" rel="noreferrer" onClick={handlePurchaseIntent}>
                <Button className="bg-white text-[#301b73] hover:bg-slate-100" size="lg">
                  <ShoppingCartIcon className="h-5 w-5" /> Comprar ahora
                </Button>
              </a>
              <Link href="#coleccion">
                <Button variant="secondary" size="lg" className="bg-white/20 text-white ring-white/40 hover:bg-white/30">
                  <TicketIcon className="h-5 w-5" /> Ver colección completa
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
