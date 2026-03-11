"use client";

import { useRef } from "react";
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

function TiltCard({ children, cardClassName }: { children: React.ReactNode; cardClassName: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-4px) scale(1.01)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="will-change-transform"
      style={{ transition: "transform 0.18s ease, box-shadow 0.18s ease" }}
    >
      <Card className={cardClassName}>
        {children}
      </Card>
    </div>
  );
}

export function UniverseCards(): React.JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* ── Animals ── */}
      <TiltCard cardClassName="group relative border border-[#bfd196] bg-[linear-gradient(180deg,#f8ffe7,#e5f4c4)] shadow-[0_16px_34px_rgba(74,114,39,0.2)] hover:shadow-[0_24px_44px_rgba(74,114,39,0.3)]">
        <CardContent className="space-y-3 p-4">
          <Badge className="w-fit bg-[#dcf0b4] text-[#1b2b13]">
            <Squares2X2Icon className="h-4 w-4" /> Universo Animals
          </Badge>

          <div className="space-y-1">
            <h2 className="font-title text-2xl text-[#1b2b13] sm:text-3xl">Doflins Animals</h2>
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

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="bg-[linear-gradient(135deg,#4a7a20,#78a93f)]"
              onClick={() => broadcastUniverse("animals")}
            >
              <Link href="/reveal?universe=animals">
                <Squares2X2Icon className="h-4 w-4" /> Entrar a Animals{" "}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" onClick={() => broadcastUniverse("animals")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-4 w-4" /> Comprar packs
              </Link>
            </Button>
          </div>
        </CardContent>
      </TiltCard>

      {/* ── Multiverse ── */}
      <TiltCard cardClassName="group border border-[#b7c7fb] bg-[linear-gradient(180deg,#edf3ff,#d9e5ff)] shadow-[0_16px_34px_rgba(66,86,174,0.2)] hover:shadow-[0_24px_44px_rgba(66,86,174,0.32)]">
        <CardContent className="space-y-3 p-4">
          <Badge className="w-fit bg-[#d2deff] text-[#1a2b7e]">
            <BoltIcon className="h-4 w-4" /> Universo Multiverse
          </Badge>

          <div className="space-y-1">
            <h2 className="font-title text-2xl text-[#1a2b7a] sm:text-3xl">Doflins Multiverse</h2>
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

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="bg-[linear-gradient(135deg,#3f58cf,#6f8dff)]"
              onClick={() => broadcastUniverse("multiverse")}
            >
              <Link href="/reveal?universe=multiverse">
                <BoltIcon className="h-4 w-4" /> Entrar a Multiverse{" "}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" onClick={() => broadcastUniverse("multiverse")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-4 w-4" /> Comprar packs
              </Link>
            </Button>
          </div>
        </CardContent>
      </TiltCard>
    </div>
  );
}
