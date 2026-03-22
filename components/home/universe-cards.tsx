"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { broadcastUniverse } from "@/lib/universe-store";

const UNIVERSES = [
  {
    key: "animals" as const,
    title: "Animals",
    tagline: "Naturaleza viva. Rarezas salvajes.",
    href: "/reveal?universe=animals",
    gradient: "from-[#e8f5e0] to-[#d0eabc]",
    border: "border-[#b8d8a0]",
    titleColor: "text-[#1f3618]",
    tagColor: "text-[#3d5a32]",
    btnClass: "bg-[#3a7a28] hover:bg-[#2e6820]",
  },
  {
    key: "mega" as const,
    title: "Mega",
    tagline: "Escala XL. Presencia única.",
    href: "/reveal?universe=mega",
    gradient: "from-[#fef8e8] to-[#fdefc0]",
    border: "border-[#e0c878]",
    titleColor: "text-[#6a4210]",
    tagColor: "text-[#a06020]",
    btnClass: "bg-[#c47c20] hover:bg-[#a86818]",
  },
  {
    key: "multiverse" as const,
    title: "Multiverse",
    tagline: "Variantes intensas. Energía sci-fi.",
    href: "/reveal?universe=multiverse",
    gradient: "from-[#edf0ff] to-[#dbe3ff]",
    border: "border-[#b8c6f8]",
    titleColor: "text-[#1c2a6a]",
    tagColor: "text-[#3050a0]",
    btnClass: "bg-[#4460d0] hover:bg-[#3850b8]",
  },
] as const;

export function UniverseCards(): React.JSX.Element {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-title text-2xl font-bold text-[var(--ink-900)] sm:text-3xl">
          Tres universos. Una colección única.
        </h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {UNIVERSES.map((u) => (
          <Link
            key={u.key}
            href={u.href}
            onClick={() => broadcastUniverse(u.key)}
            className={`group flex flex-col items-center gap-4 rounded-3xl border bg-gradient-to-b ${u.gradient} ${u.border} p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
          >
            <h3 className={`font-title text-2xl font-bold ${u.titleColor}`}>{u.title}</h3>
            <p className={`text-sm leading-relaxed ${u.tagColor}`}>{u.tagline}</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors ${u.btnClass}`}>
              Explorar <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
