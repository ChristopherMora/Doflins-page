import type { Metadata } from "next";

import { ColeccionShell } from "@/components/collection/coleccion-shell";

export const metadata: Metadata = {
  title: "Mi Colección",
  description: "Lleva el registro de los Doflins que has conseguido, revisa tu progreso por rareza y descubre cuántos te faltan para completar tu colección de Animals y Multiverse.",
  openGraph: {
    title: "Mi Colección DOFLINS",
    description: "Lleva el registro de tus figuras DOFLINS, revisa tu progreso por rareza y completa tu colección.",
  },
  robots: {
    index: false, // No indexar colecciones personales
  },
};

export default function ColeccionPage(): React.JSX.Element {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 pb-28 sm:px-8 sm:pb-12">
      <ColeccionShell />
    </main>
  );
}
