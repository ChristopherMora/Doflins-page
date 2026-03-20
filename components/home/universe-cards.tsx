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
    el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 5}deg) translateY(-6px) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex h-full will-change-transform"
      style={{ transition: "transform 0.22s cubic-bezier(0.33,1,0.68,1), box-shadow 0.22s ease" }}
    >
      <Card className={`w-full transition-shadow duration-300 ${cardClassName}`}>
        {children}
      </Card>
    </div>
  );
}

export function UniverseCards(): React.JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {/* ── Animals ── */}
      <TiltCard cardClassName="group relative border border-[#b0d4a0] bg-[linear-gradient(160deg,#f4faf0,#dcefd2)] shadow-[0_16px_34px_rgba(60,120,50,0.14)] hover:shadow-[0_24px_44px_rgba(60,120,50,0.24)]">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          {/* Icon + badge row */}
          <div className="flex items-start justify-between">
            <Badge className="w-fit bg-[#d4ecc8] text-[#2a4a1e]">
              <Squares2X2Icon className="h-3.5 w-3.5" /> Universo Animals
            </Badge>
            <span className="text-3xl" aria-hidden>🦔</span>
          </div>

          {/* Title + desc */}
          <div className="flex-1 space-y-1.5">
            <h2 className="font-title text-2xl leading-tight text-[#1f3618] sm:text-[1.6rem]">Doflins Animals</h2>
            <p className="text-sm leading-relaxed text-[#3d5a32]">
              Explora criaturas del universo Animals, revisa rarezas y avanza tu colección oficial.
            </p>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs text-[#3d5a32]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#b8d4a8]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#4a8030]" /> Catálogo completo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#b8d4a8]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#4a8030]" /> Rarezas naturales
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="flex-1 bg-[linear-gradient(135deg,#3a7a28,#58a040)] text-sm shadow-md"
              onClick={() => broadcastUniverse("animals")}
            >
              <Link href="/reveal?universe=animals">
                Entrar a Animals
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" onClick={() => broadcastUniverse("animals")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
        <div aria-hidden className="home-card-bark-strip" />
      </TiltCard>

      {/* ── Mega Animals ── */}
      <TiltCard cardClassName="group relative border-2 border-[#e8cc90] bg-[linear-gradient(160deg,#fffbee,#fdefc0)] shadow-[0_16px_34px_rgba(180,130,30,0.22)] hover:shadow-[0_24px_44px_rgba(180,130,30,0.34)]">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          {/* Icon + badge row */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <Badge className="w-fit bg-[#fce8a0] text-[#7a4e14]">
                <Squares2X2Icon className="h-3.5 w-3.5" /> Universo Mega Animals
              </Badge>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#c47c20]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#c47c20] ring-1 ring-[#c47c20]/30">
                Tamaño XL
              </span>
            </div>
            <span className="text-3xl" aria-hidden>🦣</span>
          </div>

          {/* Title + desc */}
          <div className="flex-1 space-y-1.5">
            <h2 className="font-title text-2xl leading-tight text-[#7a4e14] sm:text-[1.6rem]">Mega Doflins</h2>
            <p className="text-sm leading-relaxed text-[#a06020]">
              Las versiones grandes e imponentes de los Animals. Figuras XL con presencia única para los coleccionistas más ambiciosos.
            </p>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs text-[#a06020]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#e0c070]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#c47c20]" /> Figuras XL
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#e0c070]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#c47c20]" /> Rarezas exclusivas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#e0c070]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#c47c20]" /> Serie limitada
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="flex-1 bg-[linear-gradient(135deg,#c47c20,#e8a830)] text-sm shadow-md"
              onClick={() => broadcastUniverse("mega")}
            >
              <Link href="/reveal?universe=mega">
                Entrar a Mega
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" onClick={() => broadcastUniverse("mega")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
        <div aria-hidden className="home-card-bark-strip" />
      </TiltCard>

      {/* ── Multiverse ── */}
      <TiltCard cardClassName="group border border-[#b7c7fb] bg-[linear-gradient(160deg,#eaefff,#d6e3ff)] shadow-[0_16px_34px_rgba(66,86,174,0.18)] hover:shadow-[0_24px_44px_rgba(66,86,174,0.30)]">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          {/* Icon + badge row */}
          <div className="flex items-start justify-between">
            <Badge className="w-fit bg-[#d2deff] text-[#1a2b7e]">
              <BoltIcon className="h-3.5 w-3.5" /> Universo Multiverse
            </Badge>
            <span className="text-3xl" aria-hidden>⚡</span>
          </div>

          {/* Title + desc */}
          <div className="flex-1 space-y-1.5">
            <h2 className="font-title text-2xl leading-tight text-[#1a2b7a] sm:text-[1.6rem]">Doflins Multiverse</h2>
            <p className="text-sm leading-relaxed text-[#2f4490]">
              Entra al universo de variantes intensas con estética sci-fi y rarezas de alto impacto.
            </p>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs text-[#2f4490]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#c4d0fb]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#425fd8]" /> Variantes especiales
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[#c4d0fb]">
              <CheckCircleIcon className="h-3.5 w-3.5 text-[#425fd8]" /> Rarezas altas
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="flex-1 bg-[linear-gradient(135deg,#3f58cf,#6f8dff)] text-sm shadow-md"
              onClick={() => broadcastUniverse("multiverse")}
            >
              <Link href="/reveal?universe=multiverse">
                Entrar a Multiverse
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" onClick={() => broadcastUniverse("multiverse")}>
              <Link href="#compras">
                <GlobeAltIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
        <div aria-hidden className="home-card-bark-strip" />
      </TiltCard>

    </div>
  );
}
