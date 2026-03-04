"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { broadcastUniverse } from "@/lib/universe-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UniverseCards(): React.JSX.Element {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* ── Animals ── */}
      <Card
        className="group relative border border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)] shadow-[0_14px_30px_rgba(85,108,50,0.15)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgba(85,108,50,0.22)]"
        onMouseEnter={() => broadcastUniverse("animals")}
      >
        <CardContent className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit bg-[#e6f2d0] text-[#1f2a1a]">
              <SparklesIcon className="h-4 w-4" /> Universo Animals
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="font-title text-3xl text-[#1f2a1a] sm:text-4xl">Doflins Animals</h2>
            <p className="text-sm leading-relaxed text-[#3d5230]">
              Explora criaturas del universo Animals, revisa rarezas y avanza tu colección oficial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#3d5230]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
              <CheckCircleIcon className="h-4 w-4 text-[#4e6f2a]" /> Catálogo completo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
              <CheckCircleIcon className="h-4 w-4 text-[#4e6f2a]" /> Rarezas naturales
            </span>
          </div>

          <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <Button
              asChild
              size="lg"
              className="w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] sm:w-auto"
              onClick={() => broadcastUniverse("animals")}
            >
              <Link href="/reveal?universe=animals">
                <SparklesIcon className="h-5 w-5" /> Entrar a Animals{" "}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" onClick={() => broadcastUniverse("animals")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-5 w-5" /> Comprar packs
              </Link>
            </Button>
          </div>
          <p className="text-xs text-[#64785a]">Acceso directo al catálogo oficial de DOFLINS.</p>
        </CardContent>
      </Card>

      {/* ── Multiverse ── */}
      <Card
        className="group border border-[#c8d3f4] bg-[linear-gradient(180deg,#eef2ff,#e3eaff)] shadow-[0_14px_30px_rgba(72,87,152,0.16)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgba(72,87,152,0.26)]"
        onMouseEnter={() => broadcastUniverse("multiverse")}
      >
        <CardContent className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit bg-[#dbe4ff] text-[#1f2c67]">
              <BoltIcon className="h-4 w-4" /> Universo Multiverse
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="font-title text-3xl text-[#1c2960] sm:text-4xl">Doflins Multiverse</h2>
            <p className="text-sm leading-relaxed text-[#2d3f7a]">
              Entra al universo de variantes intensas con estética sci-fi y rarezas de alto impacto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#2d3f7a]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#ced7fb]">
              <CheckCircleIcon className="h-4 w-4 text-[#4b5fc0]" /> Variantes especiales
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#ced7fb]">
              <CheckCircleIcon className="h-4 w-4 text-[#4b5fc0]" /> Rarezas altas
            </span>
          </div>

          <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <Button
              asChild
              size="lg"
              className="w-full bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] sm:w-auto"
              onClick={() => broadcastUniverse("multiverse")}
            >
              <Link href="/reveal?universe=multiverse">
                <BoltIcon className="h-5 w-5" /> Entrar a Multiverse{" "}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" onClick={() => broadcastUniverse("multiverse")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-5 w-5" /> Comprar packs
              </Link>
            </Button>
          </div>
          <p className="text-xs text-[#3d4f8a]">Cambia entre universos dentro del catálogo cuando quieras.</p>
        </CardContent>
      </Card>
    </div>
  );
}
