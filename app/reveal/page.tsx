import { Suspense } from "react";
import type { Metadata } from "next";

import { RevealExperience } from "@/components/reveal/reveal-experience";
import { BottomNav } from "@/components/nav/bottom-nav";

export const metadata: Metadata = {
  title: "DOFLINS | Animals + Multiverse",
  description: "Página oficial de DOFLINS con secciones Animals y Multiverse, rareza, filtros y catálogo completo.",
};

function RevealSkeleton(): React.JSX.Element {
  return (
    <main className="min-h-screen pb-32 bg-[#f6f2df]">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 mx-auto w-full max-w-[84rem] px-4 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 rounded-full border border-[#e2d9b8] bg-[#fff8e7]/90 px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-[#d8cfa8]" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-[#d8cfa8]" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-full bg-[#d8cfa8]" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-10 pb-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <div className="h-6 w-28 animate-pulse rounded-full bg-[#d8cfa8]" />
            <div className="space-y-2">
              <div className="h-12 w-4/5 animate-pulse rounded-xl bg-[#d8cfa8]" />
              <div className="h-12 w-3/5 animate-pulse rounded-xl bg-[#d1c89a]" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[#ddd4b0]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[#ddd4b0]" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-40 animate-pulse rounded-full bg-[#cac09a]" />
              <div className="h-12 w-36 animate-pulse rounded-full bg-[#ddd4b0]" />
            </div>
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-[#d8cfa8] lg:h-auto" />
        </div>
      </div>

      {/* Catalog grid skeleton */}
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-5 h-6 w-48 animate-pulse rounded-full bg-[#d8cfa8]" />
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-3 overflow-hidden rounded-2xl border border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)] p-3">
              <div className="h-[132px] animate-pulse rounded-xl bg-[#e8dcb8] sm:h-[145px]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#e2d9b0]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#e8e0c4]" />
              <div className="flex gap-1.5">
                <div className="h-5 w-16 animate-pulse rounded-full bg-[#e0d8b4]" />
                <div className="h-5 w-12 animate-pulse rounded-full bg-[#e8e0c4]" />
              </div>
              <div className="h-8 animate-pulse rounded-full bg-[#d5c98e]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function RevealPage(): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<RevealSkeleton />}>
        <RevealExperience />
      </Suspense>
      <BottomNav />
    </>
  );
}

