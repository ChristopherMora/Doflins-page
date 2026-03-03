import type { Metadata } from "next";

import { MyCollection } from "@/components/collection/my-collection";

export const metadata: Metadata = {
  title: "Mi Colección | DOFLINS",
  description: "Lleva el registro de los Doflins que has conseguido y descubre cuántos te faltan.",
};

export default function ColeccionPage(): React.JSX.Element {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 pb-28 sm:px-8 sm:pb-12">
      <MyCollection />
    </main>
  );
}
