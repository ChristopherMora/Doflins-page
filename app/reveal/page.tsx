import { Suspense } from "react";
import type { Metadata } from "next";

import { RevealExperience } from "@/components/reveal/reveal-experience";

export const metadata: Metadata = {
  title: "DOFLINS | Animals + Multiverse",
  description: "Página oficial de DOFLINS con secciones Animals y Multiverse, rareza, filtros y catálogo completo.",
};

export default function RevealPage(): React.JSX.Element {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-5 py-20">Cargando reveal...</main>}>
      <RevealExperience />
    </Suspense>
  );
}
