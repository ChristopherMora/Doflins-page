import { Suspense } from "react";
import type { Metadata } from "next";

import { RevealExperience } from "@/components/reveal/reveal-experience";

export const metadata: Metadata = {
  title: "DOFLINS | Colección y rarezas",
  description: "Página oficial de colección DOFLINS con niveles de rareza, packs y catálogo completo.",
};

export default function RevealPage(): React.JSX.Element {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-5 py-20">Cargando reveal...</main>}>
      <RevealExperience />
    </Suspense>
  );
}
