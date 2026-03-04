"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  Squares2X2Icon,
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
        className="group relative border border-[#bfd196] bg-[linear-gradient(180deg,#f8ffe7,#e5f4c4)] shadow-[0_16px_34px_rgba(74,114,39,0.2)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_rgba(74,114,39,0.3)]"
      >
        <CardContent className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit bg-[#dcf0b4] text-[#1b2b13]">
              <Squares2X2Icon className="h-4 w-4" /> Universo Animals
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="font-title text-3xl text-[#1b2b13] sm:text-4xl">Doflins Animals</h2>
            <p className="text-sm leading-relaxed text-[#335027]">
              Explora criaturas del universo Animals, revisa rarezas y avanza tu colección oficial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#335027]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/78 px-3 py-1 ring-1 ring-[#cbdaaa]">
              <CheckCircleIcon className="h-4 w-4 text-[#4a7a20]" /> Catálogo completo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/78 px-3 py-1 ring-1 ring-[#cbdaaa]">
              <CheckCircleIcon className="h-4 w-4 text-[#4a7a20]" /> Rarezas naturales
            </span>
          </div>

          <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <Button
              asChild
              size="lg"
              className="w-full bg-[linear-gradient(135deg,#4a7a20,#78a93f)] sm:w-auto"
              onClick={() => broadcastUniverse("animals")}
            >
              <Link href="/reveal?universe=animals">
                <Squares2X2Icon className="h-5 w-5" /> Entrar a Animals{" "}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" onClick={() => broadcastUniverse("animals")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-5 w-5" /> Comprar packs
              </Link>
            </Button>
          </div>
          <p className="text-xs text-[#5b7450]">Acceso directo al catálogo oficial de DOFLINS.</p>
        </CardContent>
      </Card>

      {/* ── Multiverse ── */}
      <Card
        className="group border border-[#b7c7fb] bg-[linear-gradient(180deg,#edf3ff,#d9e5ff)] shadow-[0_16px_34px_rgba(66,86,174,0.2)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_rgba(66,86,174,0.32)]"
      >
        <CardContent className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit bg-[#d2deff] text-[#1a2b7e]">
              <BoltIcon className="h-4 w-4" /> Universo Multiverse
            </Badge>
          </div>

          <div className="space-y-2">
            <h2 className="font-title text-3xl text-[#1a2b7a] sm:text-4xl">Doflins Multiverse</h2>
            <p className="text-sm leading-relaxed text-[#2f4490]">
              Entra al universo de variantes intensas con estética sci-fi y rarezas de alto impacto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#2f4490]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/78 px-3 py-1 ring-1 ring-[#c4d0fb]">
              <CheckCircleIcon className="h-4 w-4 text-[#425fd8]" /> Variantes especiales
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/78 px-3 py-1 ring-1 ring-[#c4d0fb]">
              <CheckCircleIcon className="h-4 w-4 text-[#425fd8]" /> Rarezas altas
            </span>
          </div>

          <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <Button
              asChild
              size="lg"
              className="w-full bg-[linear-gradient(135deg,#3f58cf,#6f8dff)] sm:w-auto"
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
          <p className="text-xs text-[#3a4f96]">Cambia entre universos dentro del catálogo cuando quieras.</p>
        </CardContent>
      </Card>
    </div>
  );
}
