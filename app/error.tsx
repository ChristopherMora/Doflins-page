"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    // Podrías enviar el error a Sentry u otro servicio aquí
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <ExclamationTriangleIcon className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="font-title text-2xl font-bold text-[var(--ink-900,#1a1a1a)]">
          Algo salió mal
        </h1>
        <p className="max-w-sm text-sm text-[var(--ink-600,#64748b)]">
          Ocurrió un error inesperado. Intenta de nuevo o regresa al inicio.
        </p>
        {error.digest ? (
          <p className="font-mono text-[10px] text-[var(--ink-400,#94a3b8)]">
            {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Intentar de nuevo</Button>
        <Button variant="secondary" asChild>
          <a href="/">Ir al inicio</a>
        </Button>
      </div>
    </main>
  );
}
