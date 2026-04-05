import type { Metadata } from "next";

import { getCollection } from "@/lib/server/reveal-service";
import { ColeccionShell } from "@/components/collection/coleccion-shell";

export const metadata: Metadata = {
  title: "Mi Colección",
  description: "Lleva el registro de los Doflins que has conseguido, revisa tu progreso por rareza y descubre cuántos te faltan para completar tu colección de Animals y Multiverse.",
  openGraph: {
    title: "Mi Colección DOFLINS",
    description: "Lleva el registro de tus figuras DOFLINS, revisa tu progreso por rareza y completa tu colección.",
  },
  robots: {
    index: false,
  },
};

export default async function ColeccionPage(): Promise<React.JSX.Element> {
  // Prefetch del catálogo público (ISR 60s) para que los componentes
  // tengan datos disponibles de inmediato sin esperar fetch cliente
  const initialDoflins = await getCollection().catch(() => []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 pb-28 sm:px-8 sm:pb-12">
      <ColeccionShell initialDoflins={initialDoflins} />
    </main>
  );
}
