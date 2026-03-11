import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BottomNav } from "@/components/nav/bottom-nav";
import { BolsaRevealExperience } from "@/components/bolsa/bolsa-reveal-experience";
import { getDb } from "@/lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface BolsaPageProps {
  params: Promise<{ codigo: string }>;
}

interface DoflinItem {
  id: number;
  nombre: string;
  modeloBase: string;
  variante: string;
  serie: string;
  numeroColeccion: number;
  rareza: string;
  probabilidad: number;
  imagenUrl: string;
  siluetaUrl: string;
  datoCurioso: string | null;
}

async function getBolsaData(codigo: string): Promise<{
  packSize: number;
  doflins: DoflinItem[];
} | null> {
  try {
    const db = getDb();

    const [bag] = await db
      .select({
        id: codigosBolsa.id,
        packSize: codigosBolsa.packSize,
        status: codigosBolsa.status,
        scanCount: codigosBolsa.scanCount,
      })
      .from(codigosBolsa)
      .where(eq(codigosBolsa.codigo, codigo.toUpperCase()))
      .limit(1);

    if (!bag || bag.status === "blocked") return null;

    const items = await db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        modeloBase: doflins.modeloBase,
        variante: doflins.variante,
        serie: doflins.serie,
        numeroColeccion: doflins.numeroColeccion,
        rareza: doflins.rareza,
        probabilidad: doflins.probabilidad,
        imagenUrl: doflins.imagenUrl,
        siluetaUrl: doflins.siluetaUrl,
        datoCurioso: doflins.datoCurioso,
      })
      .from(codigosBolsaItems)
      .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
      .where(eq(codigosBolsaItems.codigoBolsaId, bag.id))
      .orderBy(asc(codigosBolsaItems.posicion));

    // Registrar scan (fire and forget) — incremento atómico
    void db
      .update(codigosBolsa)
      .set({ scanCount: (bag.scanCount ?? 0) + 1, usado: true, lastScannedAt: new Date(), updatedAt: new Date() })
      .where(eq(codigosBolsa.id, bag.id))
      .catch(console.error);

    return { packSize: bag.packSize, doflins: items };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BolsaPageProps): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Bolsa ${codigo} | DOFLINS`,
    description: "Escanea el código QR de tu bolsa DOFLINS para ver qué figuras contiene.",
    robots: { index: false },
  };
}

export default async function BolsaPage({ params }: BolsaPageProps): Promise<React.JSX.Element> {
  const { codigo } = await params;

  const data = await getBolsaData(codigo);

  if (!data) notFound();

  const { packSize, doflins: items } = data;

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 pb-32 sm:px-6">
        <BolsaRevealExperience
          items={items}
          packSize={packSize}
          codigo={codigo.toUpperCase()}
        />
      </main>
      <BottomNav />
    </>
  );
}
