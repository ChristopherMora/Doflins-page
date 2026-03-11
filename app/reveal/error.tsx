"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";

export default function RevealError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error("[RevealError]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-6 pb-32 pt-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#eef4d9,#d5e5b2)] shadow-[0_16px_40px_rgba(78,111,42,0.2)] text-3xl">
        🐾
      </div>
      <div className="space-y-2">
        <h1 className="font-title text-2xl font-bold text-[var(--ink-900,#1a1a1a)]">
          El catálogo no pudo cargar
        </h1>
        <p className="max-w-sm text-sm text-[var(--ink-600,#64748b)]">
          No logramos conectar con la base de datos de Doflins. Intenta de nuevo en unos segundos.
        </p>
        {error.digest ? (
          <p className="font-mono text-[10px] text-[var(--ink-400,#94a3b8)]">
            ID: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button
          onClick={reset}
          className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] text-white hover:brightness-105"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reintentar
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>

      {/* Fallback info */}
      <p className="max-w-xs text-xs text-[var(--ink-400,#94a3b8)]">
        Puedes ver los packs disponibles en la{" "}
        <Link href="/" className="underline underline-offset-2">
          página principal
        </Link>
        .
      </p>
    </main>
  );
}
